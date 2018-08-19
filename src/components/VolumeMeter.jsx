// @flow

import React, { Component } from 'react';

type Props = {
    audioContext: AudioContext,
    src: AudioNode,
    width: number,
    height: number,
    enabled?: boolean,
    maxVolume: number,
    style: {}
}

class MeterDrawer {
  canvasCtx: CanvasRenderingContext2D;

  width: number;

  height: number;

  prevVolume: number;

  maxVolume: number;

  +barWidth: number;

  constructor(ctx, height, width, maxVolume) {
    this.canvasCtx = ctx;
    this.height = height;
    this.width = width;
    this.maxVolume = maxVolume || 50;

    this.barWidth = width / 6;
  }

  start() {
    this.prevVolume = 0;
  }

  clear() {
    const {
      canvasCtx, width, height,
    } = this;
    canvasCtx.clearRect(0, 0, width, height);
  }

  draw(volume) {
    const {
      prevVolume, canvasCtx, barWidth, height, maxVolume,
    } = this;
    const vol = Math.max(volume, prevVolume * 0.95);
    this.clear();

    for (let i = 0; i < 5; i += 1) {
      if (i === 4 && maxVolume < vol) {
        // eslint-disable-next-line no-param-reassign
        canvasCtx.fillStyle = 'red';
      } else if ((i + 1) * (maxVolume / 5) < vol) {
        // eslint-disable-next-line no-param-reassign
        canvasCtx.fillStyle = 'green';
      } else {
        // eslint-disable-next-line no-param-reassign
        canvasCtx.fillStyle = 'grey';
      }
      const x = barWidth * 6 / 5 * i;
      const y = height * 0.6 - height * i * 0.15;

      canvasCtx.fillRect(x, y, barWidth, height - y);
      if (vol < maxVolume && i * 10 < vol) {
        // eslint-disable-next-line no-param-reassign
        canvasCtx.fillStyle = 'green';
        canvasCtx.fillRect(
          x,
          y,
          ((vol % (maxVolume / 5)) / (maxVolume / 5)) * (barWidth),
          height - y,
        );
      }
    }
  }
}


class VolumeMeter extends Component<Props> {
  static defaultProps = {
    enabled: true,
  };

  canvas = React.createRef();

  componentDidMount() {
    const { width, height, maxVolume } = this.props;
    if (!this.canvas.current) {
      return;
    }
    const canvasCtx = this.canvas.current.getContext('2d');

    this.drawer = new MeterDrawer(canvasCtx, width, height, maxVolume);

    this.drawer.clear();
  }


  componentDidUpdate(prevProps: Props) {
    const { audioContext, src, enabled } = this.props;
    if (src && !prevProps.src) {
      this.analyser = audioContext.createAnalyser();
      src.connect(this.analyser);
      this.array = new Uint8Array(this.analyser.frequencyBinCount);
      if (enabled) {
        this.start();
      }
    }

    if (enabled && !prevProps.enabled) {
      this.start();
    }
    if (!enabled && prevProps.enabled) {
      this.stop();
    }
  }

  start = () => {
    this.drawer.start();

    const drawLoop = () => {
      const { enabled } = this.props;
      if (!enabled) {
        return;
      }
      const volume = this.getVolume();
      this.drawer.draw(volume);
      this.rafId = window.requestAnimationFrame(drawLoop);
    };

    drawLoop();
  };

  stop = () => {
    this.drawer.clear();
    window.cancelAnimationFrame(this.rafId);
  };


  getVolume = () => {
    this.analyser.getByteFrequencyData(this.array);

    return this.array.reduce((sum, val) => sum + val, 0) / this.array.length;
  };

  drawer: MeterDrawer;

  rafId: number;

  array: Uint8Array;

  analyser: AnalyserNode;

  render() {
    const { width, height, style } = this.props;

    return (
      <canvas
        ref={this.canvas}
        width={width}
        height={height}
        style={style}
      />
    );
  }
}

export default VolumeMeter;

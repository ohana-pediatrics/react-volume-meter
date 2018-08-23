// @flow

import React, { Component } from 'react';


const DEFAULT_MAX_VOLUME = 50;

export const VM_STEPPED = 0;
export const VM_FLAT = 1;
type VmShape = 0 | 1;

type Props = {
    audioContext: AudioContext,
    src: AudioNode,
    width: number,
    height: number,
    enabled?: boolean,
    maxVolume: number,
    shape: VmShape,
    blocks?: number,
    style: {}
}

class MeterDrawer {
  canvasCtx: CanvasRenderingContext2D;

  width: number;

  height: number;

  prevVolume: number;

  maxVolume: number;

  +blocks: number;

  +barWidth: number;

  +shape: VmShape;

  blockMaxima: Array<number>;

  constructor(ctx, {
    height, width, maxVolume = DEFAULT_MAX_VOLUME, shape = VM_STEPPED, blocks = 5,
  }) {
    this.canvasCtx = ctx;
    this.height = height;
    this.width = width;

    this.maxVolume = maxVolume;
    this.shape = shape;

    this.blocks = blocks;
    this.barWidth = width / (blocks + 1);

    this.blockMaxima = Array(blocks).fill(0).map((_, i) => (i + 1) * maxVolume / blocks);
  }

  start() {
    this.prevVolume = 0;
  }

  stop() {
    this.prevVolume = 0;
    this.draw(0);
  }

  clear() {
    const {
      canvasCtx, width, height,
    } = this;
    canvasCtx.clearRect(0, 0, width, height);
  }

  draw(volume) {
    const {
      prevVolume, canvasCtx, barWidth, height, maxVolume, shape, blocks,
    } = this;
    const vol = Math.max(volume, prevVolume * 0.95);
    this.prevVolume = vol;
    this.clear();
    const volPerBlock = maxVolume / blocks;

    this.blockMaxima.forEach((blockMax, i) => {
      let color = 'grey';

      if (vol > maxVolume && blockMax >= maxVolume) {
        color = 'red';
      } else if (vol > blockMax) {
        color = 'green';
      }

      canvasCtx.fillStyle = color;

      const x = barWidth * (blocks + 1) / blocks * i;
      const y = height - (shape === VM_STEPPED ? height * (i + 1) * (1 / (blocks + 1)) : height);

      canvasCtx.fillRect(x, y, barWidth, height - y);

      if (vol < maxVolume && blockMax < vol) {
        // eslint-disable-next-line no-param-reassign
        canvasCtx.fillStyle = 'green';
        canvasCtx.fillRect(
          x,
          y,
          // ((v % B) / B) is a sawtooth with period B and amplitude 1
          ((vol % (volPerBlock)) / (volPerBlock)) * (barWidth),
          height - y,
        );
      }
    });
  }
}

const sum = (a, b) => a + b;

class VolumeMeter extends Component<Props> {
  static defaultProps = {
    enabled: true,
    blocks: 5,
  };

  canvas = React.createRef();

  componentDidMount() {
    const {
      width, height, maxVolume, shape, blocks, audioContext, src,
    } = this.props;
    if (!this.canvas.current) {
      return;
    }
    const canvasCtx = this.canvas.current.getContext('2d');

    this.drawer = new MeterDrawer(canvasCtx, {
      width, height, maxVolume, shape, blocks,
    });

    this.drawer.stop();
    if (audioContext && src) {
      this.setupAnalyzer();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { src, enabled } = this.props;
    this.stop();
    if (src && src !== prevProps.src) {
      this.setupAnalyzer();
    }

    if (enabled) {
      this.start();
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
    this.drawer.stop();
    window.cancelAnimationFrame(this.rafId);
  };

  setupAnalyzer = () => {
    const { audioContext, src, enabled } = this.props;
    this.analyser = audioContext.createAnalyser();
    src.connect(this.analyser);
    this.array = new Uint8Array(this.analyser.frequencyBinCount);
    if (enabled) {
      this.start();
    }
  };

  getVolume = () => {
    this.analyser.getByteFrequencyData(this.array);

    return this.array.reduce(sum, 0) / this.array.length;
  };

  drawer: MeterDrawer;

  rafId: number;

  array: Uint8Array;

  analyser: AnalyserNode;

  render() {
    const { width, height, style } = this.props;

    return (
      <canvas
        className="volume-meter"
        ref={this.canvas}
        width={width}
        height={height}
        style={style}
      />
    );
  }
}

export default VolumeMeter;

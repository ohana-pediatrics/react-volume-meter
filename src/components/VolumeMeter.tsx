import React, {Component, CSSProperties, RefObject} from 'react';

export enum VmShape {
  VM_STEPPED,
  VM_FLAT
}

type Props = {
    audioContext: AudioContext,
    src?: MediaStreamAudioSourceNode,
    width: number,
    height: number,
    enabled?: boolean,
    shape: VmShape,
    blocks?: number,
    style?: CSSProperties
}

interface MeterDrawerOptions {
  width: number;
  height: number;
  blocks: number;
  shape: VmShape;
}

class MeterRenderer {
  canvasCtx: CanvasRenderingContext2D;

  width: number;

  height: number;

  prevVolume: number;

  readonly blocks: number;

  readonly barWidth: number;

  readonly shape: VmShape;

  blockMaxima: Array<number>;

  constructor(ctx: CanvasRenderingContext2D, {
    height, width, shape = VmShape.VM_STEPPED, blocks = 5,
  }: MeterDrawerOptions) {
    this.canvasCtx = ctx;
    this.height = height;
    this.width = width;

    this.shape = shape;

    this.blocks = blocks;
    this.barWidth = width / (blocks + 1);

    this.blockMaxima = Array(blocks).fill(0).map((_, i) => (i + 1) / blocks);
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

  draw(volume: number) {
    const {
      prevVolume, canvasCtx, barWidth, height, shape, blocks,
    } = this;
    const vol = Math.max(volume, prevVolume * 0.95);
    this.prevVolume = vol;
    this.clear();
    const volPerBlock = 1 / blocks;

    this.blockMaxima.forEach((blockMax, i) => {
      let color = 'grey';

      if (vol > 0.8 && blockMax >= 1) {
        color = 'red';
      } else if (vol > blockMax) {
        color = 'green';
      }

      canvasCtx.fillStyle = color;

      const x = barWidth * (blocks + 1) / blocks * i;
      const y = height - (shape === VmShape.VM_STEPPED ? height * (i + 1) * (1 / (blocks + 1)) : height);

      canvasCtx.fillRect(x, y, barWidth, height - y);

      if (vol < 1 && blockMax < vol) {
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

export class VolumeMeter extends Component<Props> {
  static defaultProps = {
    enabled: true,
    blocks: 5,
  };

  canvas:RefObject<HTMLCanvasElement> = React.createRef();

  private getCanvasContext = (): CanvasRenderingContext2D => {
    const canvas = this.canvas.current;
    if(!canvas) {
      throw new Error('Cannot get a reference to the canvas');
    }
    const canvasCtx = canvas.getContext('2d');
    if(!canvasCtx) {
      throw new Error('2D context not avaiable');
    }

    return canvasCtx;
  };

  componentDidMount() {
    const {
      width, height, shape, blocks=5, audioContext, src,
    } = this.props;

    const canvasCtx = this.getCanvasContext();


    this.drawer = new MeterRenderer(canvasCtx, {
      width, height, shape, blocks,
    });

    this.drawer.stop();
    if (audioContext && src) {
      this.setupAnalyzer();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { src, enabled } = this.props;
    if (this.changedSource(prevProps.src, src)) {
      this.stop();
      this.setupAnalyzer();
    }

    if (!enabled && prevProps.enabled) {
      this.stop();
    }

    if (this.analyser && enabled && !prevProps.enabled) {
      this.start();
    }
  }

  componentWillUnmount() {
    this.stop();
  }

  private changedSource = (
    oldSrc: MediaStreamAudioSourceNode | undefined,
    newSrc: MediaStreamAudioSourceNode | undefined,
  ): boolean => {
    if (!oldSrc && !newSrc) {
      return false;
    }

    if (!oldSrc) {
      return true;
    }

    if (!newSrc) {
      return true;
    }

    return oldSrc.mediaStream.id !== newSrc.mediaStream.id;
  };

  private start = () => {
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

  private stop = () => {
    this.drawer.stop();
    window.cancelAnimationFrame(this.rafId);
  };

  private setupAnalyzer = () => {
    const { audioContext, src, enabled } = this.props;
    if (!src) {
      return;
    }
    this.analyser = audioContext.createAnalyser();
    src.connect(this.analyser);
    this.array = new Uint8Array(this.analyser.frequencyBinCount);
    if (enabled) {
      this.start();
    }
  };

  private getVolume = () => {
    this.analyser.getByteTimeDomainData(this.array);

    return this.array.reduce((max, vol) => Math.max(max, Math.abs(vol - 128))) / 128;
  };

  private drawer: MeterRenderer;

  private rafId: number;

  private array: Uint8Array;

  private analyser: AnalyserNode;

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

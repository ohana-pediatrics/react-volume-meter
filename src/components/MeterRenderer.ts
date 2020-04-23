import { VmShape } from "..";

export interface MeterDrawerOptions {
  width: number;
  height: number;
  blocks: number;
  shape: VmShape;
}

export class MeterRenderer {
  canvasCtx: CanvasRenderingContext2D;
  width: number;
  height: number;
  prevVolume: number;
  readonly blocks: number;
  readonly barWidth: number;
  readonly shape: VmShape;
  blockMaxima: Array<number>;

  constructor(
    ctx: CanvasRenderingContext2D,
    {
      height,
      width,
      shape = VmShape.VM_STEPPED,
      blocks = 5,
    }: MeterDrawerOptions
  ) {
    this.canvasCtx = ctx;
    this.height = height;
    this.width = width;

    this.shape = shape;

    this.blocks = blocks;
    this.barWidth = width / (blocks + 1);

    this.blockMaxima = Array(blocks)
      .fill(0)
      .map((_, i) => (i + 1) / blocks);

    this.stop();
  }

  start() {
    this.prevVolume = 0;
  }

  stop() {
    this.prevVolume = 0;
    this.draw(0);
  }

  clear() {
    const { canvasCtx, width, height } = this;
    canvasCtx.clearRect(0, 0, width, height);
  }

  draw(volume: number) {
    const { prevVolume, canvasCtx, barWidth, height, shape, blocks } = this;
    const vol = Math.max(volume, prevVolume * 0.9);
    this.prevVolume = vol;
    this.clear();
    const volPerBlock = 1 / blocks;

    this.blockMaxima.forEach((blockMax, i) => {
      let color = "grey";

      if (vol > 0.8 && blockMax >= 1) {
        color = "red";
      } else if (vol > blockMax) {
        color = "green";
      }

      canvasCtx.fillStyle = color;

      const x = ((barWidth * (blocks + 1)) / blocks) * i;
      const y =
        height -
        (shape === VmShape.VM_STEPPED
          ? height * (i + 1) * (1 / (blocks + 1))
          : height);

      canvasCtx.fillRect(x, y, barWidth, height - y);

      if (vol < 1 && blockMax < vol) {
        canvasCtx.fillStyle = "green";
        canvasCtx.fillRect(
          x,
          y,
          // ((v % B) / B) is a sawtooth with period B and amplitude 1
          ((vol % volPerBlock) / volPerBlock) * barWidth,
          height - y
        );
      }
    });
  }
}

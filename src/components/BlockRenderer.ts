import { VmShape } from "..";
import { MeterDrawerOptions, MeterRenderer } from "./MeterRenderer";

export class BlockRenderer extends MeterRenderer {
  readonly blocks: number;
  readonly barWidth: number;
  readonly blockMaxima: number[];

  constructor(
    ctx: CanvasRenderingContext2D,
    {
      height,
      width,
      shape = VmShape.VM_STEPPED,
      blocks = 5,
    }: MeterDrawerOptions & { blocks?: number }
  ) {
    super(ctx, { height, width, shape });

    this.blocks = blocks;
    this.barWidth = width / (blocks + 1);

    this.blockMaxima = Array(blocks)
      .fill(0)
      .map((_, i) => (i + 1) / blocks);

    this.init();
  }

  draw(volume: number) {
    super.draw(volume);
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

      if (this.watchdogExpired) {
        canvasCtx.fillStyle = "orange";
      }

      const x = ((barWidth * (blocks + 1)) / blocks) * i;
      const y =
        height -
        (shape === VmShape.VM_STEPPED
          ? height * (i + 1) * (1 / (blocks + 1))
          : height);

      canvasCtx.fillRect(x, y, barWidth, height - y);

      /**
       * Handle partial filling of the last block to fill
       */
      if (!this.watchdogExpired) {
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
      }
    });
  }
}

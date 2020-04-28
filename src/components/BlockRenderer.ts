import { VmShape } from "..";
import { MeterDrawerOptions, MeterRenderer } from "./MeterRenderer";

const TOO_LOUD = 0.8;
const DECAY_RATE = 0.9;
export class BlockRenderer extends MeterRenderer {
  readonly bucketCount: number;
  readonly bucketSize: number;
  readonly barWidth: number;
  readonly bucketCeilings: number[];

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

    this.bucketCount = blocks;
    this.bucketSize = 1 / blocks;

    this.barWidth = width / (blocks + 1);

    this.bucketCeilings = Array(blocks)
      .fill(0)
      .map((_, i) => (i + 1) * this.bucketSize);

    this.init();
  }

  draw(volume: number) {
    super.draw(volume);
    const {
      prevVolume,
      canvasCtx,
      barWidth,
      height,
      shape,
      bucketSize,
      bucketCount,
    } = this;
    const vol = Math.max(volume, prevVolume * DECAY_RATE);
    this.prevVolume = vol;
    this.clear();

    this.bucketCeilings.forEach((bucketCeiling, i) => {
      let color = "grey";

      if (vol > bucketCeiling) {
        if (bucketCeiling > TOO_LOUD) {
          color = "red";
        } else {
          color = "green";
        }
      }

      canvasCtx.fillStyle = color;

      if (this.watchdogExpired) {
        canvasCtx.fillStyle = "orange";
      }

      const x = barWidth * (bucketCount + 1) * bucketSize * i;
      const y =
        height -
        (shape === VmShape.VM_STEPPED
          ? height * (i + 1) * (1 / (bucketCount + 1))
          : height);

      canvasCtx.fillRect(x, y, barWidth, height - y);

      /**
       * Handle partial filling of the last block to fill
       */
      if (!this.watchdogExpired) {
        if (bucketCeiling > vol && vol > bucketCeiling - this.bucketSize) {
          canvasCtx.fillStyle = vol > TOO_LOUD ? "red" : "green";
          canvasCtx.fillRect(
            x,
            y,
            // ((v % B) / B) is a sawtooth with period B and amplitude 1
            ((vol % this.bucketSize) / this.bucketSize) * barWidth,
            height - y
          );
        }
      }
    });
  }
}

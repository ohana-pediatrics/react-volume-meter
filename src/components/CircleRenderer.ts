import { MeterDrawerOptions, MeterRenderer } from "./MeterRenderer";

export class CircleRenderer extends MeterRenderer {
  constructor(ctx: CanvasRenderingContext2D, options: MeterDrawerOptions) {
    super(ctx, options);
    this.init();
  }

  draw(volume: number) {
    super.draw(volume);
    const { prevVolume, canvasCtx, height, width } = this;
    const vol = Math.max(volume, prevVolume * 0.9);
    this.prevVolume = vol;
    this.clear();

    let color = "green";

    if (vol > 0.8) {
      color = "red";
    }

    const radius = Math.min(height, width) / 2;

    canvasCtx.fillStyle = "transparent";
    canvasCtx.strokeStyle = "transparent";

    if (this.watchdogExpired) {
      canvasCtx.fillStyle = "orange";
    }

    canvasCtx.beginPath();
    canvasCtx.arc(width / 2, height / 2, radius - 10, 0, 2 * Math.PI);
    canvasCtx.stroke();
    canvasCtx.fill();

    if (!this.watchdogExpired) {
      canvasCtx.fillStyle = color;
      canvasCtx.beginPath();
      canvasCtx.arc(width / 2, height / 2, (radius - 10) * vol, 0, 2 * Math.PI);
      canvasCtx.stroke();
      canvasCtx.fill();
    }
  }
}

import { VmShape } from "..";

export interface MeterDrawerOptions {
  width: number;
  height: number;
  shape: VmShape;
}

export class MeterRenderer {
  canvasCtx: CanvasRenderingContext2D;
  width: number;
  height: number;
  prevVolume: number;
  readonly shape: VmShape;

  constructor(
    ctx: CanvasRenderingContext2D,
    { height, width, shape = VmShape.VM_STEPPED }: MeterDrawerOptions
  ) {
    this.canvasCtx = ctx;
    this.height = height;
    this.width = width;
    this.shape = shape;
  }

  init() {
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
    throw new Error("Not Implemented");
  }
}

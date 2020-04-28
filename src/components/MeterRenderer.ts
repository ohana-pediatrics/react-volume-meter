import { VmShape } from "..";

export interface MeterDrawerOptions {
  width: number;
  height: number;
  shape: VmShape;
}

const WATCHDOG_PERIOD = 1000;

export abstract class MeterRenderer {
  canvasCtx: CanvasRenderingContext2D;
  width: number;
  height: number;
  prevVolume: number;
  readonly shape: VmShape;
  private watchdog: number;
  protected watchdogExpired: boolean;
  private watchdogTimer: number;

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

  private checkWatchdog() {
    const now = +new Date();
    if (now - this.watchdog > WATCHDOG_PERIOD) {
      this.watchdogExpired = true;
      this.draw(0);
    }
    this.watchdog = now;
    this.watchdogTimer = window.setTimeout(() => {
      this.checkWatchdog();
    }, WATCHDOG_PERIOD / 2);
  }

  start() {
    this.prevVolume = 0;
    this.watchdog = +new Date();
    this.watchdogExpired = false;
    this.watchdogTimer = window.setTimeout(() => {
      this.checkWatchdog();
    }, WATCHDOG_PERIOD / 2);
  }

  stop() {
    this.prevVolume = 0;
    window.clearTimeout(this.watchdogTimer);
    this.watchdogExpired = false;
    this.draw(0);
  }

  clear() {
    const { canvasCtx, width, height } = this;
    canvasCtx.clearRect(0, 0, width, height);
  }

  draw(volume: number) {
    this.watchdog = +new Date();
  }
}

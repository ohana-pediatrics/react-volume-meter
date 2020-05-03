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

  private startWatchdog() {
    this.watchdog = +new Date();
    this.watchdogTimer = window.setTimeout(() => {
      this.checkWatchdog();
    }, WATCHDOG_PERIOD / 2);
  }

  private checkWatchdog() {
    const now = +new Date();
    if (now - this.watchdog > WATCHDOG_PERIOD) {
      this.watchdogExpired = true;
      this.draw(0);
    } else {
      this.watchdogExpired = false;
    }
    this.startWatchdog();
  }

  start() {
    this.prevVolume = 0;
    this.watchdogExpired = false;
    this.startWatchdog();
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

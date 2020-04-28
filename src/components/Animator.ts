import { Optional } from "@ahanapediatrics/ahana-fp";
import { EventEmitter } from "events";
import { MeterRenderer } from "./MeterRenderer";

const getVolume = (analyser: AnalyserNode) => {
  const buckets = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buckets);

  return buckets.reduce((a, b) => a + b) / analyser.frequencyBinCount / 128;
};

export class Animator extends EventEmitter {
  private rafId: number = 0;
  private isStopping: boolean = false;
  private renderer: MeterRenderer;
  private analyser: Optional<AnalyserNode>;

  constructor(analyser: Optional<AnalyserNode>, renderer: MeterRenderer) {
    super();
    this.analyser = analyser;
    this.renderer = renderer;
  }

  updateAnalyzer(analyser: Optional<AnalyserNode>) {
    this.stop();
    this.analyser = analyser;
  }

  start() {
    this.renderer.start();
    this.emit("start");

    const drawLoop = () => {
      this.analyser.ifPresent((analyser) => {
        if (this.isStopping) {
          this.isStopping = false;
          return;
        }
        const volume = getVolume(analyser);
        this.renderer.draw(volume);
        this.rafId = window.requestAnimationFrame(drawLoop);
      });
    };

    drawLoop();
  }

  stop() {
    this.emit("stop");
    this.renderer.stop();
    this.isStopping = true;
    window.cancelAnimationFrame(this.rafId);
  }
}

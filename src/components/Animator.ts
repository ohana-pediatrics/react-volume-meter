import { Optional } from "@ahanapediatrics/ahana-fp";
import { MeterRenderer } from "./MeterRenderer";

const getVolume = (analyser: AnalyserNode) => {
  const buckets = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buckets);

  return buckets.reduce((a, b) => a + b) / analyser.frequencyBinCount / 128;
};

export class Animator {
  private enabled: boolean = false;
  private rafId: number = 0;
  private renderer: MeterRenderer;
  private analyser: Optional<AnalyserNode>;

  constructor(
    analyser: Optional<AnalyserNode>,
    enabled: boolean,
    renderer: MeterRenderer
  ) {
    this.analyser = analyser;
    this.enabled = enabled;
    this.renderer = renderer;
    if (enabled) {
      this.start();
    }
  }

  updateAnalyzer(analyser: Optional<AnalyserNode>) {
    this.stop();
    this.enabled = false;
    this.analyser = analyser;
  }

  enable(state: boolean) {
    if (this.enabled === state) {
      return;
    }
    this.enabled = state;
    if (!state) {
      this.stop();
    } else {
      this.start();
    }
  }

  private start() {
    this.renderer.start();

    const drawLoop = () => {
      if (!this.enabled) {
        return;
      }
      this.analyser.ifPresent((analyser) => {
        const volume = getVolume(analyser);
        this.renderer.draw(volume);
        this.rafId = window.requestAnimationFrame(drawLoop);
      });
    };

    drawLoop();
  }

  stop() {
    this.renderer.stop();
    window.cancelAnimationFrame(this.rafId);
  }
}

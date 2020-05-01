import { Optional } from "@ahanapediatrics/ahana-fp";
import { EventEmitter } from "events";
import { setupAnalyzer } from "./functions";
import { MeterRenderer } from "./MeterRenderer";

const getVolume = (analyser: AnalyserNode) => {
  const buckets = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buckets);

  return buckets.reduce((a, b) => a + b) / analyser.frequencyBinCount / 128;
};

export class Animator extends EventEmitter {
  private ctx: AudioContext;
  private rafId: number = 0;
  private isStopping: boolean = false;
  private renderer: MeterRenderer;
  private stream: MediaStream;
  private analyser?: AnalyserNode;

  constructor(ctx: AudioContext, renderer: MeterRenderer) {
    super();
    this.ctx = ctx;
    this.renderer = renderer;
  }

  changeStream(s: Optional<MediaStream>) {
    const { isStopping } = this;
    this.stop();

    s.ifPresent((stream) => {
      if (stream.id === this.stream?.id) {
        if (!isStopping) {
          this.start();
        }
      } else {
        this.stream = stream;
        const a = setupAnalyzer({ audioContext: this.ctx, stream });
        a.minDecibels = -100;
        a.maxDecibels = -30;
        a.fftSize = 64;
        this.analyser = a;
      }
    });
  }

  start() {
    this.renderer.start();
    this.isStopping = false;
    this.emit("start");

    const drawLoop = () => {
      if (this.isStopping || !this.analyser) {
        this.isStopping = false;
        return;
      }
      const volume = getVolume(this.analyser);
      this.renderer.draw(volume);
      this.rafId = window.requestAnimationFrame(drawLoop);
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

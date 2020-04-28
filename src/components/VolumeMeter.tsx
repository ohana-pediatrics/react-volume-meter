import { Optional } from "@ahanapediatrics/ahana-fp";
import React, {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animator } from "./Animator";
import { BlockRenderer } from "./BlockRenderer";
import { CircleRenderer } from "./CircleRenderer";
import { Alert, Clickable, MeterDisplay, StyledVolumeMeter } from "./layout";

export enum VmShape {
  VM_CIRCLE,
  VM_STEPPED,
  VM_FLAT,
}

type Props = {
  audioContext: AudioContext;
  stream: Optional<MediaStream>;
  width: number;
  height: number;
  enabled?: boolean;
  shape: VmShape;
  blocks?: number;
  activateButton?: (onClick: () => Promise<void>) => ReactNode;
};

const getCanvasContext = (
  canvas: HTMLCanvasElement | null
): CanvasRenderingContext2D => {
  if (!canvas) {
    throw new Error("Cannot get a reference to the canvas");
  }
  const canvasCtx = canvas.getContext("2d");
  if (!canvasCtx) {
    throw new Error("2D context not avaiable");
  }

  return canvasCtx;
};

const setupAnalyzer = ({
  audioContext,
  stream,
}: Pick<Props, "audioContext" | "stream">) => {
  return stream.map((s) => {
    if (typeof audioContext === "undefined") {
      return undefined;
    }
    const node = audioContext.createMediaStreamSource(s);
    const analyser = audioContext.createAnalyser();
    node.connect(analyser);
    return analyser;
  });
};

const defaultActivateButton = (onClick: () => Promise<void>) => (
  <button type="button" onClick={onClick}>
    Activate
  </button>
);

type MonitorOptions = {
  onEnabledChanged: (e: boolean) => unknown;
  onStopCalled: () => unknown;
};
const monitorTrack = (
  track: MediaStreamTrack & { watched?: boolean },
  { onEnabledChanged, onStopCalled }: MonitorOptions
) => {
  if (track.watched) {
    return;
  }
  const originalEnabled = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(track),
    "enabled"
  );
  if (!originalEnabled) {
    throw new Error('Cannot stalk "enabled"');
  }
  const { set: setter } = originalEnabled;

  const originalStop = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(track),
    "stop"
  );
  if (!originalStop) {
    throw new Error('Cannot stalk "stop"');
  }

  let _enabled = track.enabled;

  Object.defineProperty(track, "enabled", {
    configurable: originalEnabled.configurable,
    enumerable: originalEnabled.enumerable,
    get: function () {
      return _enabled;
    },
    set: function (e) {
      _enabled = e;
      setter!.call(track, e);
      onEnabledChanged(e);
    },
  });

  Object.defineProperty(track, "stop", {
    configurable: originalStop.configurable,
    enumerable: originalStop.enumerable,
    value: function () {
      onStopCalled();
      return originalStop.value();
    },
  });

  Object.defineProperty(track, "watched", {
    value: true,
  });
};

export const VolumeMeter = ({
  enabled = true,
  width,
  height,
  shape,
  blocks = 5,
  audioContext,
  stream,
  activateButton = defaultActivateButton,
}: Props) => {
  const canvas: RefObject<HTMLCanvasElement> = useRef(null);
  const [animator, setAnimator] = useState(Optional.empty<Animator>());
  const [contextState, setContextState] = useState(audioContext.state);
  const [trackEnabled, setTrackEnabled] = useState(true);
  const [unableToProvideData, setUnableToProvideData] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const onStateChange = useCallback(() => {
    setContextState(audioContext.state);
  }, [audioContext]);

  const enableTrack = (e: boolean) => {
    if (stream.isPresent()) {
      const s = stream.get();
      const tr = s.getAudioTracks()[0];
      tr.enabled = e;
    }
  };

  useEffect(() => {
    audioContext.addEventListener("statechange", onStateChange);
    return () => {
      audioContext.removeEventListener("statechange", onStateChange);
    };
  }, [audioContext]);

  const onUnableToProvideData = useCallback(() => {
    setUnableToProvideData(true);
  }, []);
  const onAbleToProvideData = useCallback(() => {
    setUnableToProvideData(false);
  }, []);
  const onTrackHasEnded = useCallback(() => {
    setHasEnded(true);
  }, []);

  useEffect(() => {
    if (stream.isPresent()) {
      const s = stream.get();
      const tr = s.getAudioTracks()[0];
      if (tr) {
        setTrackEnabled(tr.enabled);
        monitorTrack(tr, {
          onEnabledChanged: setTrackEnabled,
          onStopCalled: () => {
            setHasEnded(true);
          },
        });

        setUnableToProvideData(tr.muted);
        tr.addEventListener("mute", onUnableToProvideData);
        tr.addEventListener("unmute", onAbleToProvideData);

        setHasEnded(tr.readyState === "ended");
        tr.addEventListener("ended", onTrackHasEnded);
      }
      return () => {
        tr.removeEventListener("mute", onUnableToProvideData);
        tr.removeEventListener("unmute", onAbleToProvideData);
        tr.removeEventListener("ended", onTrackHasEnded);
      };
    }
    return () => {};
  }, [stream]);

  useEffect(() => {
    setContextState(audioContext.state);
  }, [audioContext]);

  useEffect(() => {
    {
      const canvasCtx = getCanvasContext(canvas.current);

      const renderer =
        shape === VmShape.VM_CIRCLE
          ? new CircleRenderer(canvasCtx, {
              width,
              height,
              shape,
            })
          : new BlockRenderer(canvasCtx, {
              width,
              height,
              shape,
              blocks,
            });

      setAnimator(
        Optional.of(
          new Animator(
            setupAnalyzer({ audioContext, stream }),
            enabled,
            renderer
          )
        )
      );
    }
  }, [canvas, audioContext, stream, contextState]);

  useEffect(() => {
    animator.ifPresent((a) => {
      a.stop();
      a.updateAnalyzer(setupAnalyzer({ audioContext, stream }));
      a.enable(enabled);
    });
    return () => {
      animator.ifPresent((a) => {
        a.stop();
      });
    };
  }, [stream, animator, audioContext, enabled, contextState]);

  useEffect(() => {
    animator.ifPresent((a) => a.enable(enabled));
  }, [enabled]);

  const track = stream.map((s) => s.getAudioTracks()).map((t) => t[0]);

  // prettier-ignore
  const error = 
  !track.isPresent()      ?   ("No Audio Input detected")                           : 
  unableToProvideData     ?   ("Audio Input halted")                                : 
  !trackEnabled           ?   ( <>
                                  Audio is muted.{" "}
                                  <Clickable
                                    onClick={() => {
                                      enableTrack(true);
                                    }}
                                  >
                                    Click to unmute
                                  </Clickable>
                                </>
                              )                                                     : 
  hasEnded                ?   ('The input device no longer provides audio')  :
                              null;

  return (
    <StyledVolumeMeter width={width} height={height}>
      {contextState !== "running" &&
        activateButton(() =>
          audioContext.resume().then(() => setContextState(audioContext.state))
        )}
      <MeterDisplay
        show={contextState === "running"}
        className="volume-meter"
        ref={canvas}
        width={width}
        height={height}
      />
      {contextState === "running" && error && (
        <Alert height={height}>{error}</Alert>
      )}
    </StyledVolumeMeter>
  );
};

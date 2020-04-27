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
import { Alert, Bars, Clickable, StyledVolumeMeter } from "./layout";

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

const monitorEnabled = (
  track: MediaStreamTrack & { watched?: boolean },
  onChange: (e: boolean) => unknown
) => {
  if (track.watched) {
    return;
  }
  const original = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(track),
    "enabled"
  );
  if (!original) {
    throw new Error('Cannot stalk "enabled"');
  }
  let { get: getter, set: setter } = original;

  let _enabled = track.enabled;

  getter = function () {
    return _enabled;
  };

  Object.defineProperty(track, "enabled", {
    configurable: true,
    enumerable: true,
    get: getter,
    set: function (e) {
      console.log(`Changed to ${e}`);
      _enabled = e;
      setter!.call(track, e);
      onChange(e);
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

  useEffect(() => {
    if (stream.isPresent()) {
      const s = stream.get();
      const tr = s.getAudioTracks()[0];
      if (tr) {
        setTrackEnabled(tr.enabled);
        monitorEnabled(tr, setTrackEnabled);
        setUnableToProvideData(tr.muted);
        tr.addEventListener("mute", onUnableToProvideData);
        tr.addEventListener("unmute", onAbleToProvideData);
      }
      return () => {
        tr.removeEventListener("mute", onUnableToProvideData);
        tr.removeEventListener("unmute", onAbleToProvideData);
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

  console.log("render");

  return (
    <StyledVolumeMeter width={width} height={height}>
      {contextState !== "running" &&
        activateButton(() =>
          audioContext.resume().then(() => setContextState(audioContext.state))
        )}
      <Bars
        show={contextState === "running"}
        className="volume-meter"
        ref={canvas}
        width={width}
        height={height}
      />
      {contextState === "running" && (
        <>
          {!stream.isPresent() && (
            <Alert height={height}>No Audio Input detected</Alert>
          )}
          {track.isPresent() && unableToProvideData && (
            <Alert height={height}>Audio Input halted</Alert>
          )}
          {track.isPresent() && !unableToProvideData && !trackEnabled && (
            <Alert height={height}>
              Audio is muted.{" "}
              <Clickable
                onClick={() => {
                  enableTrack(true);
                }}
              >
                Click to unmute
              </Clickable>
            </Alert>
          )}
        </>
      )}
    </StyledVolumeMeter>
  );
};

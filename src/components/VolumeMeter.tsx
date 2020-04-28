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
import { getCanvasContext, monitorTrack, setupAnalyzer } from "./functions";
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

const defaultActivateButton = (onClick: () => Promise<void>) => (
  <button type="button" onClick={onClick}>
    Activate
  </button>
);

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
  const [animatorRunning, setAnimatorRunning] = useState(false);
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
  const unmuteButton = () => (
    <>
      Audio is muted.{" "}
      <Clickable
        onClick={() => {
          enableTrack(true);
        }}
      >
        Click to unmute
      </Clickable>
    </>
  );

  useEffect(() => {
    audioContext.addEventListener("statechange", onStateChange);
    return () => {
      audioContext.removeEventListener("statechange", onStateChange);
    };
  }, [audioContext]);

  useEffect(() => {
    animator.ifPresent((a) => {
      if (enabled) {
        a.start();
      } else {
        a.stop();
      }
    });
  }, [enabled, animator]);

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

    const ani = new Animator(setupAnalyzer({ audioContext, stream }), renderer);
    ani.addListener("start", () => setAnimatorRunning(true));
    ani.addListener("stop", () => setAnimatorRunning(false));
    setAnimator(Optional.of(ani));
  }, [canvas, audioContext, stream, contextState]);

  useEffect(() => {
    animator.ifPresent((a) => {
      a.stop();
      a.updateAnalyzer(setupAnalyzer({ audioContext, stream }));
      if (enabled) {
        a.start();
      }
    });
    return () => {
      animator.ifPresent((a) => {
        a.stop();
      });
    };
  }, [stream, animator, audioContext, enabled, contextState]);

  useEffect(() => {
    animator.ifPresent((a) => {
      if (enabled) {
        a.start();
      }
    });
  }, [enabled, animator]);

  const track = stream.map((s) => s.getAudioTracks()).map((t) => t[0]);
  const trackCount = stream.map((s) => s.getAudioTracks().length).orElse(0);

  // prettier-ignore
  const error = 
    !animatorRunning        ?   ("Disabled")                                   : 
    !track.isPresent()      ?   ("No Audio Input detected")                    : 
    trackCount !== 1        ?   (`There are ${trackCount} tracks`)             :
    unableToProvideData     ?   ("Audio Input halted")                         : 
    !trackEnabled           ?   ( unmuteButton())                              : 
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

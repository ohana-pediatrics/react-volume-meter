import { Optional } from "@ahanapediatrics/ahana-fp";
import React, {
  MutableRefObject,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Animator } from "./Animator";
import { BlockRenderer } from "./BlockRenderer";
import { CircleRenderer } from "./CircleRenderer";
import { getCanvasContext, monitorTrack } from "./functions";
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
  const [contextState, setContextState] = useState(audioContext.state);
  const [trackEnabled, setTrackEnabled] = useState(true);
  const [unableToProvideData, setUnableToProvideData] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const anima: MutableRefObject<Animator | null> = useRef(null);

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

  const ani: Animator | null = useMemo(() => {
    if (!canvas.current) {
      return null;
    }
    const canvasCtx = getCanvasContext(canvas.current);
    const renderer =
      shape === VmShape.VM_CIRCLE
        ? new CircleRenderer(canvasCtx, {
            width,
            height,
            shape
          })
        : new BlockRenderer(canvasCtx, {
            width,
            height,
            shape,
            blocks
          });
    return new Animator(audioContext, renderer);
  }, [audioContext, canvas.current]);

  if (ani) {
    if (anima.current) {
      anima.current.stop();
    }

    ani.changeStream(stream);

    if (enabled) {
      ani.start();
    } else {
      ani.stop();
    }
    anima.current = ani;
  }

  const track = stream.map((s) => s.getAudioTracks()).map((t) => t[0]);
  const trackCount = stream.map((s) => s.getAudioTracks().length).orElse(0);

  // prettier-ignore
  const error = 
    !enabled                ?   ("Disabled")                                   : 
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

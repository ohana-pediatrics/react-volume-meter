import { Optional } from "@ahanapediatrics/ahana-fp";
import React, {
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { Animator } from "./Animator";
import { MeterRenderer } from "./MeterRenderer";

export enum VmShape {
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

const StyledVolumeMeter = styled.div<{ width: number; height: number }>`
  height: ${(props) => props.height}px;
  width: ${(props) => props.width}px;
`;

const Bars = styled.canvas<{ show: boolean }>`
  display: ${(props) => (props.show ? "block" : "none")};
`;

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

  useEffect(() => {
    setContextState(audioContext.state);
  }, [audioContext]);

  useEffect(() => {
    {
      const canvasCtx = getCanvasContext(canvas.current);

      const renderer = new MeterRenderer(canvasCtx, {
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
    </StyledVolumeMeter>
  );
};

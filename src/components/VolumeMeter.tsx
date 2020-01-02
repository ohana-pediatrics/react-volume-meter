import { Optional } from "@ahanapediatrics/ahana-fp";
import React, { CSSProperties, RefObject, useEffect, useState } from "react";
import { Animator } from "./Animator";
import { MeterRenderer } from "./MeterRenderer";

export enum VmShape {
  VM_STEPPED,
  VM_FLAT
}

type Props = {
  audioContext: AudioContext | undefined;
  src: Optional<MediaStreamAudioSourceNode>;
  width: number;
  height: number;
  enabled?: boolean;
  shape: VmShape;
  blocks?: number;
  style?: CSSProperties;
};

const changedSource = (
  oldSrc: Optional<MediaStreamAudioSourceNode>,
  newSrc: Optional<MediaStreamAudioSourceNode>
): boolean => {
  return (
    (oldSrc.isPresent() || newSrc.isPresent()) &&
    !oldSrc.equals(newSrc, (o, n) => o.mediaStream.id === n.mediaStream.id)
  );
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
  src
}: Pick<Props, "audioContext" | "src">) => {
  return src.map(s => {
    if(typeof audioContext === 'undefined') {
      return undefined;
    }
    const analyser = audioContext.createAnalyser();
    s.connect(analyser);
    return analyser;
  });
};

export const VolumeMeter: React.FunctionComponent<Props> = ({
  enabled = true,
  width,
  height,
  shape,
  blocks = 5,
  audioContext,
  style,
  src
}) => {
  const canvas: RefObject<HTMLCanvasElement> = React.createRef();
  const [animator, setAnimator] = useState(Optional.empty<Animator>());

  useEffect(() => {
    {
      const canvasCtx = getCanvasContext(canvas.current);

      const drawer = new MeterRenderer(canvasCtx, {
        width,
        height,
        shape,
        blocks
      });

      drawer.stop();
    
      setAnimator(Optional.of(
        new Animator(setupAnalyzer({ audioContext, src }), enabled, drawer)
      ));
    }
  }, []);

  useEffect(() => {
    animator.ifPresent(a => {
      a.stop();
      a.updateAnalyzer(setupAnalyzer({ audioContext, src }));
      a.enable(enabled);
    });
    return () => {
      animator.ifPresent(a => {
        a.stop();
      });
    };
  }, [src]);

  useEffect(() => {
    animator.ifPresent(a => a.enable(enabled));
  }, [enabled]);

  return (
    <canvas
      className="volume-meter"
      ref={canvas}
      width={width}
      height={height}
      style={style}
    />
  );
};

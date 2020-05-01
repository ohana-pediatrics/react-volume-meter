export type MonitorOptions = {
  onEnabledChanged: (e: boolean) => unknown;
  onStopCalled: () => unknown;
};

export const monitorTrack = (
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
      return originalStop.value.call(track);
    },
  });

  Object.defineProperty(track, "watched", {
    value: true,
  });
};

export const getCanvasContext = (
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

export const setupAnalyzer = ({
  audioContext,
  stream,
}: {
  audioContext: AudioContext;
  stream: MediaStream;
}) => {
  const node = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  node.connect(analyser);
  return analyser;
};

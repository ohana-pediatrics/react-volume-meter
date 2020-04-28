import { Optional } from "@ahanapediatrics/ahana-fp";
import { StateDecorator, Store } from "@ahanapediatrics/storybook-state";
import "audio-context-polyfill";
import React from "react";
import { VmShape } from "..";
import { VolumeMeter } from "./VolumeMeter";

export default {
  title: "VolumeMeter",
  component: VolumeMeter,
};

const getAudioContext = () => {
  const audioContext = new AudioContext();
  const contextState = audioContext.state;

  return { audioContext, contextState };
};

type State = {
  audioContext: AudioContext;
  contextState: string;
  stream: Optional<MediaStream>;
};

export const base = ({ store }: { store: Store<State> }) => {
  store.state.audioContext.addEventListener("statechange", () => {
    store.set({
      contextState: store.state.audioContext.state,
    });
  });
  if (!store.state.stream.isPresent()) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        store.set({
          stream: Optional.of(stream),
        });
      })
      .catch((e) => {
        console.error("Error getting UserMedia");
        console.error(e);
      });
  }
  return (
    <div>
      <VolumeMeter
        blocks={20}
        stream={store.state.stream}
        height={50}
        shape={VmShape.VM_FLAT}
        width={300}
        audioContext={store.state.audioContext}
      />

      <div>Audio Context State: {store.state.contextState}</div>
    </div>
  );
};

base.story = {
  decorators: [
    StateDecorator({
      ...getAudioContext(),
      stream: Optional.empty(),
    }),
  ],
};

type OptionsState = {
  audioContext: AudioContext;
  contextState: string;
  stream: Optional<MediaStream>;
  audioDevices: MediaDeviceInfo[];
  selectedId: string;
};

const selectStream = (deviceId: string) =>
  navigator.mediaDevices.getUserMedia({ audio: { deviceId } });

export const withInputSelection = ({
  store,
}: {
  store: Store<OptionsState>;
}) => {
  store.state.audioContext.addEventListener("statechange", () => {
    store.set({
      contextState: store.state.audioContext.state,
    });
  });
  if (!store.state.stream.isPresent()) {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices: MediaDeviceInfo[]) => {
        const audioDevices = devices.filter((d) => d.kind === "audioinput");
        store.set({ audioDevices });

        return selectStream(audioDevices.map((d) => d.deviceId)[0]);
      })
      .then((stream) => {
        store.set({
          stream: Optional.of(stream),
        });
      })
      .catch((e) => {
        console.error("Error getting UserMedia");
        console.error(e);
      });
  }

  return (
    <div>
      <VolumeMeter
        blocks={20}
        stream={store.state.stream}
        height={50}
        shape={VmShape.VM_FLAT}
        width={300}
        audioContext={store.state.audioContext}
      />
      <div>Audio Context State: {store.state.contextState}</div>
      <button
        type="button"
        onClick={() => {
          store.set({ audioContext: new AudioContext() });
        }}
      >
        New Context
      </button>
      <div>
        <select
          value={store.state.selectedId}
          onChange={(e) => {
            store.set({ selectedId: e.target.value });
            // tslint:disable-next-line: no-floating-promises
            selectStream(e.target.value)
              .then((stream) => {
                store.set({
                  stream: Optional.of(stream),
                });
              })
              .catch((e2) => {
                console.error("Error selecting stream");
                console.error(e2);
              });
          }}
        >
          <option disabled>Please select an input...</option>
          {store.state.audioDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

withInputSelection.story = {
  decorators: [
    StateDecorator({
      ...getAudioContext(),
      stream: Optional.empty(),
      audioDevices: [],
      selectedId: "",
    }),
  ],
};

export const withActivateButton = ({ store }: { store: Store<State> }) => {
  store.state.audioContext.addEventListener("statechange", () => {
    store.set({
      contextState: store.state.audioContext.state,
    });
  });
  if (!store.state.stream.isPresent()) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        store.set({
          stream: Optional.of(stream),
        });
      })
      .catch((e) => {
        console.error("Error getting UserMedia");
        console.error(e);
      });
  }
  return (
    <div>
      <VolumeMeter
        blocks={20}
        stream={store.state.stream}
        height={50}
        shape={VmShape.VM_FLAT}
        width={300}
        audioContext={store.state.audioContext}
        activateButton={(onClick) => (
          <span onClick={onClick} style={{ cursor: "pointer" }}>
            Go For Sound
          </span>
        )}
      />

      <div>Audio Context State: {store.state.contextState}</div>
    </div>
  );
};

withActivateButton.story = {
  decorators: [
    StateDecorator({
      ...getAudioContext(),
      stream: Optional.empty(),
    }),
  ],
};

export const withNoInputStream = ({ store }: { store: Store<State> }) => {
  store.state.audioContext.addEventListener("statechange", () => {
    store.set({
      contextState: store.state.audioContext.state,
    });
  });
  return (
    <div>
      <VolumeMeter
        blocks={20}
        stream={store.state.stream}
        height={50}
        shape={VmShape.VM_FLAT}
        width={300}
        audioContext={store.state.audioContext}
      />

      <div>Audio Context State: {store.state.contextState}</div>
    </div>
  );
};

withNoInputStream.story = {
  decorators: [
    StateDecorator({
      ...getAudioContext(),
      stream: Optional.empty(),
    }),
  ],
};

export const withDisabledStream = ({
  store,
}: {
  store: Store<State & { enabled: boolean }>;
}) => {
  store.state.audioContext.addEventListener("statechange", () => {
    store.set({
      contextState: store.state.audioContext.state,
    });
  });
  if (!store.state.stream.isPresent()) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getAudioTracks().map((t) => (t.enabled = store.state.enabled));
        store.set({
          stream: Optional.of(stream),
        });
      })
      .catch((e) => {
        console.error("Error getting UserMedia");
        console.error(e);
      });
  }

  return (
    <div>
      <VolumeMeter
        blocks={20}
        stream={store.state.stream}
        height={50}
        shape={VmShape.VM_FLAT}
        width={300}
        audioContext={store.state.audioContext}
      />

      <div>Audio Context State: {store.state.contextState}</div>
      <div>
        <button
          onClick={() => {
            store.state.stream.ifPresent((s) =>
              s.getAudioTracks().map((t) => (t.enabled = !store.state.enabled))
            );
            store.set({
              enabled: !store.state.enabled,
            });
          }}
        >
          {store.state.enabled ? "Mute" : "Unmute"}
        </button>
      </div>
    </div>
  );
};

withDisabledStream.story = {
  decorators: [
    StateDecorator({
      ...getAudioContext(),
      stream: Optional.empty(),
      enabled: false,
    }),
  ],
};

export const withStoppableStream = ({ store }: { store: Store<State> }) => {
  store.state.audioContext.addEventListener("statechange", () => {
    store.set({
      contextState: store.state.audioContext.state,
    });
  });
  if (!store.state.stream.isPresent()) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        store.set({
          stream: Optional.of(stream),
        });
      })
      .catch((e) => {
        console.error("Error getting UserMedia");
        console.error(e);
      });
  }

  return (
    <div>
      <VolumeMeter
        blocks={20}
        stream={store.state.stream}
        height={50}
        shape={VmShape.VM_FLAT}
        width={300}
        audioContext={store.state.audioContext}
      />

      <div>Audio Context State: {store.state.contextState}</div>
      <div>
        <button
          onClick={() => {
            store.state.stream.ifPresent((s) =>
              s.getAudioTracks().map((t) => t.stop())
            );
          }}
        >
          Stop{" "}
        </button>
      </div>
    </div>
  );
};

withStoppableStream.story = {
  decorators: [
    StateDecorator({
      ...getAudioContext(),
      stream: Optional.empty(),
    }),
  ],
};

export const disabledMeter = ({
  store,
}: {
  store: Store<State & { enabled: boolean }>;
}) => {
  store.state.audioContext.addEventListener("statechange", () => {
    store.set({
      contextState: store.state.audioContext.state,
    });
  });
  if (!store.state.stream.isPresent()) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        store.set({
          stream: Optional.of(stream),
        });
      })
      .catch((e) => {
        console.error("Error getting UserMedia");
        console.error(e);
      });
  }
  return (
    <div>
      <VolumeMeter
        enabled={store.state.enabled}
        blocks={20}
        stream={store.state.stream}
        height={50}
        shape={VmShape.VM_FLAT}
        width={300}
        audioContext={store.state.audioContext}
      />

      <div>Audio Context State: {store.state.contextState}</div>
      <div>
        <button
          onClick={() => {
            store.set({
              enabled: !store.state.enabled,
            });
          }}
        >
          {store.state.enabled ? "Disabled" : "Enable"}
        </button>
      </div>
    </div>
  );
};

disabledMeter.story = {
  decorators: [
    StateDecorator({
      ...getAudioContext(),
      stream: Optional.empty(),
      enabled: false,
    }),
  ],
};

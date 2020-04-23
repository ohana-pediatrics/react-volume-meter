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
    // tslint:disable-next-line: no-floating-promises
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      store.set({
        stream: Optional.of(stream),
      });
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

const a = new AudioContext();
base.story = {
  decorators: [
    StateDecorator({
      audioContext: a,
      contextState: a.state,
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
    // tslint:disable-next-line: no-floating-promises
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
            selectStream(e.target.value).then((stream) => {
              store.set({
                stream: Optional.of(stream),
              });
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

const c = new AudioContext();
withInputSelection.story = {
  decorators: [
    StateDecorator({
      audioContext: c,
      contextState: c.state,
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
    // tslint:disable-next-line: no-floating-promises
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      store.set({
        stream: Optional.of(stream),
      });
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

const b = new AudioContext();
withActivateButton.story = {
  decorators: [
    StateDecorator({
      audioContext: b,
      contextState: b.state,
      stream: Optional.empty(),
    }),
  ],
};

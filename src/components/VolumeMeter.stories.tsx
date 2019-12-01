import 'audio-context-polyfill';
import { Store, StateDecorator } from "@ahanapediatrics/storybook-state";
import React from "react";
import { VmShape } from "..";
import {VolumeMeter} from './VolumeMeter';
import { Optional } from "@ahanapediatrics/ahana-fp";

export default {
  title: "VolumeMeter",
  component: VolumeMeter
};

type State = {
  audioContext: AudioContext;
  src: Optional<MediaStreamAudioSourceNode>;
};

export const base = ({ store }: { store: Store<State> }) => {
  if (!store.state.src.isPresent()) {
    // tslint:disable-next-line: no-floating-promises
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      store.set({
        src: Optional.of(
          store.state.audioContext.createMediaStreamSource(stream)
        )
      });
    });
  }
  return (
    <div>
      {store.state.audioContext.state === "running" && (
        <VolumeMeter
          blocks={20}
          src={store.state.src}
          height={50}
          shape={VmShape.VM_FLAT}
          width={300}
          audioContext={store.state.audioContext}
        />
      )}
      <div>Audio Context State: {store.state.audioContext.state}</div>
    </div>
  );
};

base.story = {
  decorators: [
    StateDecorator({
      audioContext: new AudioContext(),
      src: Optional.empty()
    })
  ]
};

type OptionsState = {
  audioContext: AudioContext;
  src: Optional<MediaStreamAudioSourceNode>;
  audioDevices: MediaDeviceInfo[];
  selectedId: string;
};

const selectStream = (deviceId: string) =>
  navigator.mediaDevices.getUserMedia({ audio: { deviceId } });

export const withInputSelection = ({
  store
}: {
  store: Store<OptionsState>;
}) => {
  if (!store.state.src.isPresent()) {
    // tslint:disable-next-line: no-floating-promises
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices: MediaDeviceInfo[]) => {
        const audioDevices = devices.filter(d => d.kind === "audioinput");
        store.set({ audioDevices });

        return selectStream(audioDevices.map(d => d.deviceId)[0]);
      })
      .then(stream => {
        store.set({
          src: Optional.of(
            store.state.audioContext.createMediaStreamSource(stream)
          )
        });
      });
  }
  return (
    <div>
      {store.state.audioContext.state === "running" && (
        <VolumeMeter
          blocks={20}
          src={store.state.src}
          height={50}
          shape={VmShape.VM_FLAT}
          width={300}
          audioContext={store.state.audioContext}
        />
      )}
      <div>Audio Context State: {store.state.audioContext.state}</div>
      <div>
        <select
          value={store.state.selectedId}
          onChange={e => {
            store.set({ selectedId: e.target.value });
            // tslint:disable-next-line: no-floating-promises
            selectStream(e.target.value).then(stream => {
              store.set({
                src: Optional.of(
                  store.state.audioContext.createMediaStreamSource(stream)
                )
              });
            });
          }}
        >
          <option disabled>Please select an input...</option>
          {store.state.audioDevices.map(d => (
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
      audioContext: new AudioContext(),
      src: Optional.empty(),
      audioDevices: [],
      selectedId: ""
    })
  ]
};

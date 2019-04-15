import React from 'react';
import {storiesOf} from '@storybook/react';
import {withState} from '@dump247/storybook-state';
import {VmShape, VolumeMeter} from '../src';

const getAudioContext = (): AudioContext =>
// @ts-ignore
  window.webkitAudioContext
    // @ts-ignore
    ? new window.webkitAudioContext()
    : new AudioContext();

type State = {
  audioContext: AudioContext,
  src: MediaStreamAudioSourceNode | undefined
};

storiesOf('VolumeMeter', module).add(
  'default',
  withState({audioContext: getAudioContext(), src: undefined} as State)(({store}) => {
    if(!store.state.src) {
      navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
        store.set({src: store.state.audioContext.createMediaStreamSource(stream)});
      });
    }
    return (
      <div>
        {store.state.audioContext.state === 'running' &&(
      <VolumeMeter
        blocks={20}
        src={store.state.src}
        height={50}
        shape={VmShape.VM_FLAT}
        width={300}
        audioContext={store.state.audioContext}/> )}
       <div>
         {store.state.audioContext.state}
       </div>
      </div>
    );
  }),
);

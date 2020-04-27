# react-volume-meter

A volume meter react component

## Installation

```
npm install react-volume-meter
```

## Example

Run `npm run storybook`, then navigate to http://localhost:6006 to
see some examples.

## Overview

This component animates a volume meter through an HTML5 `canvas` element.
It takes a Web Audio stream as input, creates an `AnalyserNode`, and
computes the volume, which it then displays through the `canvas` element.

## Props

### audioContext

An instance of either `window.audioContext` or `window.webkitAudioContext`,
depending on your browser.
If you use the Web Audio API elsewhere on the page, be sure to pass the
instance of `AudioContext` to this component, since you should
generally only have one instantiation per page.

### stream

Optional, although the animation won't start properly without it.
A Web Audio Stream object returned by a `navigator.getUserMedia`
call.

### width

The width of the canvas in pixels. The canvas adjusts its animation
automatically but is designed to look best when its width:height
ratio is 3:2.

### height

The height of the canvas in pixels. The canvas adjusts its animation
automatically but is designed to look best when its width:height
ratio is 3:2.

### maxVolume

Optional. The maximum volume level for the volume meter. Its theoretical
maximum is 255 but chances are you'll never get that high in normal use.
When the volume exceeds the `maxVolume` level, the final bar of the
meter turns red. Defaults to 50, which seems to work well for microphone
recordings of normal human speech.

### blocks

The number of blocks to include on the meter. The width of each block
scales according to the width of the meter. Defaults to 5

### shape

The shape of the meter - either `VM_FLAT` for a flat meter
or `VM_STEPPED` for a stepped meter. Defaults to `VM_STEPPED`

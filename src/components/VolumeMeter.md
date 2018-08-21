All the defaults
```
class MeterExample extends React.Component {
    constructor() {
        super()
        this.state = {
          audioCtx: window.webkitAudioContext ? new webkitAudioContext() :  new AudioContext(),
          src: null
        }
    }

    componentDidMount() {
        const {audioCtx} = this.state;
        navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
            this.setState({src:audioCtx.createMediaStreamSource(stream)});
        });
    }

    render() {
        return (
          <VolumeMeter
            audioContext={this.state.audioCtx}
            src={this.state.src}
            width={400}
            height={30}
            enabled/>
        )
    }
}

<MeterExample />
```

A stepped meter
```
const {VM_FLAT} = require('./VolumeMeter');
class MeterExample extends React.Component {
  constructor() {
    super()
    this.state = {
      audioCtx: window.webkitAudioContext ? new webkitAudioContext() :  new AudioContext(),
      src: null
    }
  }

    componentDidMount() {
        const {audioCtx} = this.state;
        navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
            this.setState({src:audioCtx.createMediaStreamSource(stream)});
        });
    }
  render() {
    return (
      <VolumeMeter
        audioContext={this.state.audioCtx}
        src={this.state.src}
        width={400}
        height={30}
        enabled
        maxVolume={100}
        blocks={5}
        shape={VM_FLAT}/>
    )
  }
}

<MeterExample />
```

Lots of blocks
```
const {VM_FLAT} = require('./VolumeMeter');
class MeterExample extends React.Component {
  constructor() {
    super()
    this.state = {
      audioCtx: window.webkitAudioContext ? new webkitAudioContext() :  new AudioContext(),
      src: null
    }
  }

    componentDidMount() {
        const {audioCtx} = this.state;
        navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
            this.setState({src:audioCtx.createMediaStreamSource(stream)});
        });
    }
  render() {
    return (
      <VolumeMeter
        audioContext={this.state.audioCtx}
        src={this.state.src}
        width={400}
        height={30}
        enabled
        maxVolume={75}
        blocks={50}
        shape={VM_FLAT}/>
    )
  }
}

<MeterExample />
```

Lots of blocks
```
const {VM_STEPPED} = require('./VolumeMeter');
class MeterExample extends React.Component {
  constructor() {
    super()
    this.state = {
      audioCtx: window.webkitAudioContext ? new webkitAudioContext() :  new AudioContext(),
      src: null
    }
  }

    componentDidMount() {
        const {audioCtx} = this.state;
        navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
            this.setState({src:audioCtx.createMediaStreamSource(stream)});
        });
    }
  render() {
    return (
      <VolumeMeter
        audioContext={this.state.audioCtx}
        src={this.state.src}
        width={400}
        height={30}
        enabled
        maxVolume={75}
        blocks={50}
        shape={VM_STEPPED}/>
    )
  }
}

<MeterExample />
```

Lots of blocks
```
const {VM_FLAT} = require('./VolumeMeter');
class MeterExample extends React.Component {
  constructor() {
    super()
    this.state = {
      audioCtx: window.webkitAudioContext ? new webkitAudioContext() :  new AudioContext(),
      src: null,
      chosenDeviceId: '',
      audioInputs: [],
    };

    navigator.mediaDevices.enumerateDevices().then(devices => {
          const audioInputs = devices.filter(d => d.kind === 'audioinput');
          this.setState({
              audioInputs,
          });
        });
  }

    componentDidMount() {
        const {audioCtx} = this.state;
    }

    componentDidUpdate(prevProps, prevState) {
        const {audioCtx, chosenDeviceId, src} = this.state;
        console.log(chosenDeviceId);
        console.log(src);
        if (chosenDeviceId === prevState.chosenDeviceId) {
            return
        }
        if(chosenDeviceId === '') {
            if(src !== null) {
                this.setState({src: null});
            }
        } else {
            navigator.mediaDevices.getUserMedia({audio: {deviceId: chosenDeviceId}}).then(stream => {
                this.setState({src:audioCtx.createMediaStreamSource(stream)});
            });
        }
    }

  render() {
    const {audioInputs} = this.state;
    return (
    <div>
    <div>
      <VolumeMeter
        audioContext={this.state.audioCtx}
        src={this.state.src}
        width={400}
        height={30}
        enabled
        maxVolume={75}
        blocks={50}
        shape={VM_FLAT}/>
     </div>
     <div>
        {audioInputs.map(a=>(
            <button
                key={a.deviceId}
                onClick={() => this.setState({chosenDeviceId: a.deviceId})} >{a.label}</button>
        ))}
        <button onClick={() => this.setState({chosenDeviceId: ''})}>None</button>
     </div>
     </div>

    )
  }
}

<MeterExample />
```



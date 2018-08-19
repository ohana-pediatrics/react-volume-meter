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
        height={300}
        enabled/>
    )
  }
}


<MeterExample />
```

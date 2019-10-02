import React from "react";
import MP4Box from "mp4box";
import StreamPlayer from "./StreamerPlayer";

class App extends React.Component {
  buffer = [];
  mime = null;
  video = null;
  firstData = false;
  streamPlayer = null;

  componentDidMount() {
    // this.configMediaSource();
    // this.configVideoElement();

    // this.configMp4box();
    // const streamId = "39cee652-057f-464b-90de-53d12841e026";
    // const url = `ws://localhost:3001/livews/${streamId}`;
    // this.configWebSocket(url);
    this.streamPlayer = new StreamPlayer();
    this.streamPlayer.connect();
  }

  configVideoElement() {
    const video = (this.video = document.getElementById("video-0"));
    video.src = URL.createObjectURL(this.mediaSource);
    video.autoplay = true;
  }
  onMSEOpen = () => {
    console.log("on MSE open");
  };

  onMSEClose = () => {
    console.log("on MSE close");
  };

  configMediaSource = () => {
    window.MediaSource = window.MediaSource || window.WebKitMediaSource;
    const mediaSource = (this.mediaSource = new window.MediaSource());
    mediaSource.addEventListener("sourceopen", this.onMSEOpen);
    mediaSource.addEventListener("sourceclose", this.onMSEClose);
    mediaSource.addEventListener("webkitsourceopen", this.onMSEOpen);
    mediaSource.addEventListener("webkitsourceclose", this.onMSEClose);
  };

  onUpdateEnd = () => {
    console.log("update end");
    //console.log("length: ", this.buffer.length);
    if (this.buffer.length > 0) {
      const data = this.buffer.shift();
      console.log("after length: ", this.buffer.length);
      this.sourceBuffer.appendBuffer(new Uint8Array(data));
      console.log({ data });
    }
  };

  onReady = info => {
    console.log({ info });
    if (info.isFragmented) {
      const { fragment_duration } = info;
      if (fragment_duration) {
        this.mediaSource.duration = info.fragment_duration / info.timescale;
      } else {
        this.mediaSource.duration = 1 / 0;
      }
    } else {
      this.mediaSource.duration = info.duration / info.timescale;
    }

    const { mime } = info;
    if (MediaSource.isTypeSupported(mime)) {
      console.log("type supported");
      const sb = (this.sourceBuffer = this.mediaSource.addSourceBuffer(mime));
      console.log("source buffer: ", this.sourceBuffer);
      sb.addEventListener("updateend", this.onUpdateEnd);
      // console.log("buffer length: ", this.buffer.length);
      // const data = this.buffer.shift();
      // sb.appendBuffer(new Uint8Array(data));
    }
    this.mime = mime;
    //this.video.play();

    // const { tracks } = info;
    // console.log("tracks:", tracks);
    // tracks.map(track => {
    //   const { codec, id } = track;
    //   const mime = 'video/mp4; codecs="' + codec + '"';
    //   if (MediaSource.isTypeSupported(mime)) {
    //     console.log("type supported");
    //     this.sourceBuffer[id] = this.mediaSource.addSourceBuffer(mime);
    //   }
    // });
  };

  configMp4box = () => {
    const mp4boxfile = (this.mp4boxfile = MP4Box.createFile());
    mp4boxfile.onReady = this.onReady;
  };

  onMessage = msg => {
    //console.log({ msg });
    let { data } = msg;
    //console.log({ data });
    if (!this.mime) {
      console.log("mime undetect");
      data.fileStart = 0;
      this.mp4boxfile.appendBuffer(data);
    } else {
      console.log("mime detected");
      this.buffer.push(data);
      console.log(this.buffer.length);
      if (this.firstData === false) {
        this.onUpdateEnd();
        this.fileStart = true;
      }
    }
  };

  configWebSocket(url) {
    const ws = (this.ws = new WebSocket(url));
    ws.binaryType = "arraybuffer";

    ws.addEventListener("message", this.onMessage);
    ws.addEventListener("error", e => {
      console.error(e);
    });
    ws.addEventListener("close", e => {
      console.log("websocket closed");
    });
    ws.addEventListener("open", e => {
      console.log("open on websocket");
      ws.send("start");
    });
    return ws;
  }

  render() {
    return <video id="video-0"></video>;
  }
}

export default App;

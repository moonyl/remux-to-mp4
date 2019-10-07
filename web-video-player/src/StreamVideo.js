import React from "react";
import MP4Box from "mp4box";

const createWebSocket = (protocol, hostname, port, path) => {
  var s = null;
  console.log("path: ", path, ", hostname: ", hostname);
  try {
    const pathExProto = `${hostname}:${port}/${path}`;
    if ("http:" === protocol) {
      //console.log("check default");
      s = new WebSocket("ws://" + pathExProto);
    } else if ("https:" === this.protocol) {
      s = new WebSocket("wss://" + pathExProto);
    }
  } catch (t) {
    console.error("error: ", t);
    //this.videoElement.pause();
  }
  return s;
};

class StreamVideo extends React.Component {
  buffer = [];
  dataProcState = "mimeDetect";
  sourceBuffer = null;

  componentDidMount() {
    //console.log("this: ", this);
    const { path } = this.props;
    this.videoElement = document.querySelector("video");
    //console.log({ path });
    this.configWebSocket(path);
    this.repeat = setInterval(this.reconnect.bind(this), 3000);
  }

  componentWillUnmount() {
    this.disconnected = !0;
    clearInterval(this.repeat);
    if (null != this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  keepAlive = () => {
    try {
      var t = {
        cmd: "H5_KEEPALIVE",
        nSpeed: "1.0",
        nTime: "0"
      };
      this.webSocket.send(JSON.stringify(t));
    } catch (t) {
      console.log(t);
    }
  };

  reconnect = () => {
    //console.log("Try Reconnect...", this.connectable);
    if (!0 === this.connectable) {
      console.log("Reconnect...");
      const { path } = this.props;
      this.configWebSocket(path);
      this.connectable = !1;
    }
    //console.log("Try Reconnect...", this.connectable);
  };

  releaseSourceBuffer = () => {
    console.log("Cleanup Source Buffer", this);
    if (!this.sourceBuffer) {
      this.sourceBuffer = null;
      this.mediaSource = null;
      this.buffer = [];
      return;
    }

    this.sourceBuffer.removeEventListener("updateend", this.appendSourceBuffer);
    this.sourceBuffer.abort();
    if (document.documentMode || /Edge/.test(navigator.userAgent)) {
      console.log("IE or EDGE!");
    } else {
      this.mediaSource.removeSourceBuffer(this.sourceBuffer);
    }
    this.sourceBuffer = null;
    this.mediaSource = null;
    this.buffer = [];
  };

  releaseWebSocket = () => {
    clearInterval(this.keepAliveRepeat);
    clearInterval(this.closeRepeat);
    this.sourceBufferCheckCount = 0;
    this.bufferedEnd = 0;
    this.bufferedEndCheckCount = 0;
  };

  configWebSocket = path => {
    //const path = "livews/897a9356-a5de-4cac-80e4-9e5331338b06";
    //const path = "livews/7a8572f4-3316-4591-9428-17df3d508223";
    const { hostname, protocol } = window.location;
    const port = 3001;
    const ws = (this.webSocket = createWebSocket(protocol, hostname, port, path));
    ws.binaryType = "arraybuffer";
    ws.onmessage = this.handleMessage;
    ws.onopen = () => {
      this.closeRepeat = setInterval(this.close, 10000);
      this.keepAliveRepeat = setInterval(this.keepAlive, 1000);
      this.mimeType = 'video/mp4; codecs="avc1.64001f,mp4a.40.2"; profiles="iso6,mp41"';
      this.mimeDetected = true;
      this.play();
      this.disconnected = 0;
      this.webSocket.send("start");
    };
    ws.onclose = () => {
      if (0 === this.disconnected) {
        console.log("wsSocket.onclose disconnect");
      } else {
        this.connectable = !0;
      }

      this.releaseSourceBuffer(this);
      this.releaseWebSocket(this);
      this.mimeType = "";
      this.mimeDetected = !1;
    };
  };

  handleMessage = msg => {
    // if (this.dataProcState === "mimeDetect") {
    //   console.log("check dataProcState");
    //   const mp4boxfile = (this.mp4boxfile = MP4Box.createFile());
    //   mp4boxfile.onReady = info => {
    //     console.log({ info });

    //     console.log("after appendBuffer");

    //     this.closeRepeat = setInterval(this.close, 10000);
    //     this.keepAliveRepeat = setInterval(this.keepAlive, 1000);
    //     this.mimeType = 'video/mp4; codecs="avc1.64001f,mp4a.40.2"; profiles="iso6,mp41"';
    //     this.mimeDetected = true;
    //     //this.play();
    //     console.log("after play");
    //     this.disconnected = 0;
    //     this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType);
    //     console.log("source buffer added");
    //     console.log("timestampOffset = " + this.sourceBuffer.timestampOffset);
    //     this.mediaSource.duration = 1 / 0;
    //     this.mediaSource.removeEventListener("sourceopen", this.alignSourceBuffer);
    //     this.sourceBuffer.addEventListener("updateend", this.appendSourceBuffer);
    //     this.dataProcState = "waitSourceOpen";
    //   };
    //   const { data } = msg;
    //   data.fileStart = 0;
    //   mp4boxfile.appendBuffer(data);

    //   return;
    // }

    //console.log("handleMessage");
    if (!0 !== this.disconnected) {
      //console.log("disconnected check");
      if (msg.data instanceof ArrayBuffer) {
        console.log("buffer length: ", this.buffer.length);
        if (this.buffer.length > 0) {
          console.log("source buffer: ", this.sourceBuffer);
          this.appendSourceBuffer();
        }
        this.buffer.push(msg.data);

        console.log("after buffer push");
        if (this.sourceBuffer.hasOwnProperty("buffered")) {
          // Internet Explorer 6-11
          const isIE = !!document.documentMode;
          if (isIE) {
            const lag = this.sourceBuffer.buffered.end(0) - this.videoElement.currentTime();
            if (lag < 0.8) {
              this.videoElement.playbackRate(0.7);
            } else {
              this.videoElement.playbackRate(1);
            }
          }
        }
        console.log("after if statement");
      } else {
        this.handleTextMessages(JSON.parse(msg.data));
      }
    }
  };

  play = () => {
    window.MediaSource = window.MediaSource || window.WebKitMediaSource;
    if (!window.MediaSource) {
      console.error("MediaSource API is not available");
    }
    if ("MediaSource" in window) {
      if (MediaSource.isTypeSupported(this.mimeType)) {
        console.log("MIME type or codec: ", this.mimeType);
      } else {
        console.error("Unsupported MIME type or codec: ", this.mimeType);
      }
    }

    this.mediaSource = new window.MediaSource();

    this.videoElement.src = URL.createObjectURL(this.mediaSource);
    console.log("after set src to videoElement");

    console.log("player paused, so start to play");
    //console.log("playerElement:", this.videoElement.el());
    // this.videoElement.play().catch(err => {
    //   console.error("play error: ", err.name);
    // });
    this.videoElement.autoplay = true;
    this.mediaSource.addEventListener("sourceopen", this.alignSourceBuffer);
  };

  appendSourceBuffer = () => {
    console.log("appendSourceBuffer");
    if (this.sourceBuffer) {
      console.log("source buffer: ", this.sourceBuffer);
      //console.log(this.buffer.length, this.sourceBuffer.updating);
      if (0 !== this.buffer.length && !this.sourceBuffer.updating) {
        var t = this.buffer.shift();
        var s = new Uint8Array(t);
        console.log("s: ", s);
        this.sourceBuffer.appendBuffer(s);
      }
    } else {
      if (s) {
        console.log("buffer length : ", s.length);
      }
      console.log(this.sourceBuffer, "is null or undefined");
    }
  };

  alignSourceBuffer = () => {
    console.log(this.mimeType);
    this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType);
    console.log("source buffer added");
    console.log("timestampOffset = " + this.sourceBuffer.timestampOffset);
    this.mediaSource.duration = 1 / 0;
    this.mediaSource.removeEventListener("sourceopen", this.alignSourceBuffer);
    this.sourceBuffer.addEventListener("updateend", this.appendSourceBuffer);
    this.webSocket.send("source opened");
    this.dataProcState = "receivePayload";
  };

  render() {
    return (
      <>
        <p>hello video</p>
        <video id="streamVideo-0"></video>
      </>
    );
  }
}

export default StreamVideo;

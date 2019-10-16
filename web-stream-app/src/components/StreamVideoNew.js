import React from "react";
import MP4Box from "mp4box";
import VideoPlayer from "@moonyl/react-video-js-player";
import VideoPtzPlayer from "./VideoPtzPlayer";
//import { Button } from "@material-ui/core";

const createWebSocket = (protocol, hostname, port, path) => {
  var s = null;
  console.log("path: ", path, ", hostname: ", hostname);
  try {
    const pathExProto = `${hostname}:${port}/${path}`;
    console.log({ pathExProto });
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

const detectMime = data => {
  const mp4boxfile = MP4Box.createFile();
  let mime = null;
  mp4boxfile.onReady = info => {
    console.log({ info });
    //this.mimeType = 'video/mp4; codecs="avc1.64001f,mp4a.40.2"; profiles="iso6,mp41"';
    //this.mimeType = info.mime;
    //this.mimeDetected = true;
    console.log("mp4box onReady");
    mime = info.mime;
  };
  //const { data } = msg;
  data.fileStart = 0;
  mp4boxfile.appendBuffer(data);
  console.log("end of detectMime");
  return mime;
};

// NOTE: explorer buffering problem
const doFlowContrl = (sourceBuffer, videoElement) => {
  const isIE = !!document.documentMode;
  if (isIE) {
    const lag = sourceBuffer.buffered.end(0) - videoElement.currentTime();
    if (lag < 0.8) {
      videoElement.playbackRate(0.7);
    } else {
      videoElement.playbackRate(1);
    }
  }
};

const handleSourceBuffer = (sourceBuffer, buffer, data, appendSourceBuffer) => {
  if (sourceBuffer && buffer.length > 0) {
    //console.log("source buffer: ", this.sourceBuffer);
    appendSourceBuffer();
  }
  buffer.push(data);

  if (!sourceBuffer) {
    console.log("not allocated source buffer");
    return;
  }
};

const updateSource = (sourceBuffer, buffer) => {
  //console.log("updateSource");
  if (sourceBuffer) {
    //console.log("source buffer: ", this.sourceBuffer);
    //console.log(this.buffer.length, this.sourceBuffer.updating);
    if (0 !== buffer.length && !sourceBuffer.updating) {
      var t = buffer.shift();
      var s = new Uint8Array(t);
      //console.log("s: ", s);
      sourceBuffer.appendBuffer(s);
    }
  } else {
    if (s) {
      console.log("buffer length : ", s.length);
    }
    console.log(this.sourceBuffer, "is null or undefined");
  }
};

const createMediaSource = (mimeType, onSourceOpen) => {
  window.MediaSource = window.MediaSource || window.WebKitMediaSource;
  if (!window.MediaSource) {
    console.error("MediaSource API is not available");
  }
  if ("MediaSource" in window) {
    if (MediaSource.isTypeSupported(mimeType)) {
      console.log("MIME type or codec: ", mimeType);
    } else {
      console.error("Unsupported MIME type or codec: ", mimeType);
    }
  }

  const mediaSource = new window.MediaSource();
  mediaSource.addEventListener("sourceopen", onSourceOpen);
  return mediaSource;
};

const configureWebSocket = (ws, onMessage, onOpen, onClose) => {
  ws.binaryType = "arraybuffer";
  ws.onmessage = onMessage;
  ws.onopen = onOpen;
  ws.onclose = onClose;
};

const createSourceBuffer = (mimeType, mediaSource, onUpdateend) => {
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
  sourceBuffer.addEventListener("updateend", onUpdateend);
  return sourceBuffer;
};

const keepAlive = ws => {
  try {
    var t = {
      cmd: "H5_KEEPALIVE",
      nSpeed: "1.0",
      nTime: "0"
    };
    //console.log("ws.send: ", ws.send);
    ws.send(JSON.stringify(t));
  } catch (t) {
    console.log(t);
  }
};

class StreamVideoNew extends React.Component {
  buffer = [];

  componentWillUnmount() {
    console.log("componentWillUnmount", this.props.path);

    this.releaseSourceBuffer();
    this.releaseWebSocket();
    this.mimeType = "";
    this.mimeDetected = !1;
    this.close();
  }

  onReady = player => {
    const { path } = this.props;
    this.videoElement = document.querySelector(`#${player.id()} video`);
    this.configWebSocket(path);
    this.repeat = setInterval(this.reconnect, 3000);
    player.aspectRatio("16:9");
  };

  handleMessage = msg => {
    //console.log({ msg });
    const { data } = msg;
    if (data instanceof ArrayBuffer) {
      if (this.openCheck === true) {
        this.mimeType = detectMime(data);
        console.log("mime: ", this.mimeType);
        this.mimeDetected = true;

        this.closeRepeat = setInterval(this.close, 10000);
        this.keepAliveRepeat = setInterval(keepAlive.bind(null, this.webSocket), 1000);
        this.play();
        this.openCheck = false;
      }

      if (true === this.disconnected) {
        return;
      }
      //console.log("disconnected check");

      //console.log("check, handle message");
      handleSourceBuffer(this.sourceBuffer, this.buffer, data, this.appendSourceBuffer);
      doFlowContrl(this.sourceBuffer, this.videoElement);
    } else {
      this.handleTextMessages(JSON.parse(data));
    }
  };

  handleTextMessages = data => {
    const { pts } = data;
    this.startPts = pts;
  };

  onWsOpen = () => {
    this.disconnected = 0;
    console.log("send start");
    this.webSocket.send("start");
    this.openCheck = true;
  };

  onWsClose = () => {
    if (0 === this.disconnected) {
      console.log("wsSocket.onclose disconnect");
    } else {
      this.connectable = !0;
    }

    this.releaseSourceBuffer();
    this.releaseWebSocket();
    this.mimeType = "";
    this.mimeDetected = !1;
  };

  releaseSourceBuffer = () => {
    console.log("Cleanup Source Buffer", this);
    if (!this.sourceBuffer) {
      this.sourceBuffer = null;
      this.mediaSource = null;
      this.buffer = [];
      return;
    }

    this.sourceBuffer.removeEventListener("updateend", this.handleMessage);
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
    const { hostname, protocol } = window.location;
    const port = 3001;
    this.webSocket = createWebSocket(protocol, hostname, port, path);
    configureWebSocket(this.webSocket, this.handleMessage, this.onWsOpen, this.onWsClose);
  };

  play = () => {
    this.mediaSource = createMediaSource(this.mimeType, this.alignSourceBuffer);
    this.videoElement.src = URL.createObjectURL(this.mediaSource);
    this.videoElement.autoplay = true;
  };

  appendSourceBuffer = () => {
    //console.log("currentTime: ", this.videoElement.currentTime);
    if (this.startPts > 0) {
      // console.log("before play");
      // this.videoElement.play().then(() => {
      //   console.log("play OK");
      // });
      console.log("readyState: ", this.videoElement.readyState);
      console.log("startPts: ", this.startPts);
      if (this.videoElement.readyState === 1) {
        //this.videoElement.play();
        this.videoElement.currentTime = this.startPts;
        //this.startPts = 0;
        //this.videoElement.autoplay = true;
        //console.log("video: ", this.videoElement);
      } else if (this.videoElement.readyState === 4) {
        this.startPts = 0;
      }
    }
    updateSource(this.sourceBuffer, this.buffer);
    //console.log("video ready: ", this.videoElement.readyState);
  };

  alignSourceBuffer = () => {
    this.sourceBuffer = createSourceBuffer(
      this.mimeType,
      this.mediaSource,
      this.appendSourceBuffer
    );
    // console.log(this.mimeType);
    // console.log("source buffer added");
    // console.log("timestampOffset = " + this.sourceBuffer.timestampOffset);
    this.mediaSource.duration = 1 / 0;
    // console.log("mediaSource: ", this.mediaSource);
    this.mediaSource.removeEventListener("sourceopen", this.alignSourceBuffer);
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

  close = () => {
    if (!0 === this.disconnected) {
      console.log("CheckSourceBuffer has been disconnect", this);
      clearInterval(this.keepAliveRepeat);
      clearInterval(this.closeRepeat);
      clearInterval(this.repeat);
    }

    if (!this.sourceBuffer) {
      this.webSocket.close();
      return;
    }

    try {
      //console.log("CheckSourceBuffer", this);

      if (this.sourceBuffer.buffered.length <= 0) {
        this.sourceBufferCheckCount++;
        if (8 < this.sourceBufferCheckCount) {
          console.log("CheckSourceBuffer Close 1");
          this.webSocket.close();
          return;
        }
      } else {
        this.sourceBufferCheckCount = 0;
        this.sourceBuffer.buffered.start(0);
        var t = this.sourceBuffer.buffered.end(0);
        var s = t - this.videoElement.currentTime;

        if (5 < s || s < 0) {
          console.log("CheckSourceBuffer Close 2", s);
          this.webSocket.close();
          return;
        }
        if (t === this.u) {
          this.bufferedEndCheckCount++;
          if (3 < this.bufferedEndCheckCount) {
            console.log("CheckSourceBuffer Close 3");
            this.webSocket.close();
            return;
          }
        } else {
          this.bufferedEndCheckCount = 0;
        }
        this.bufferedEnd = t;
      }
    } catch (t) {
      console.log(t);
    }
  };

  // increaseCurrentTime = () => {
  //   this.videoElement.currentTime += 1;
  //   console.log("increase, ", this.videoElement.currentTime);
  // };

  checkClick = event => {
    console.log("checkClick");
  };
  checkZoom = param => event => {
    console.log("checkZoom");
  };
  render() {
    // console.log("streamvideo: ", this.props.path);
    const { volumeMute, ptz } = this.props;
    return (
      <>
        {ptz === true ? (
          <VideoPtzPlayer
            onReady={this.onReady}
            onZoomIn={this.checkZoom}
            onZoomOut={this.checkZoom}
            onPreset={this.checkClick}
            onHomeSet={this.checkClick}
            onHome={this.checkClick}
          />
        ) : (
          <VideoPlayer onReady={this.onReady} />
        )}
        <VolumeMute on={volumeMute} video={this.videoElement} />
      </>
    );
  }
}

const VolumeMute = ({ on, video }) => {
  if (on) {
    if (video) video.volume = 0;
    console.log("volume mute");
  } else {
    if (video) video.volume = 0.5;
    console.log("volume: 0.5");
  }
  return <></>;
};
export default StreamVideoNew;

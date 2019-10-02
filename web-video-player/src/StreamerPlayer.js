class StreamerPlayer {
  videoElement = document.getElementById("video-0");
  host = "localhost";
  protocol = "http:";
  path = "livews/897a9356-a5de-4cac-80e4-9e5331338b06";
  connectable = !1;
  disconnected = !1;
  mimeDetected = !1;
  sourceBufferCheckCount = 0;
  buffer = [];
  bufferedEnd = 0;

  createWebSocket = path => {
    var s = "undefined";
    console.log("path: ", path, ", host: ", this.host);
    try {
      const pathExProto = this.host + ":3001" + "/" + path;
      if ("http:" === this.protocol) {
        //console.log("check default");
        s = new WebSocket("ws://" + pathExProto);
      } else if ("https:" === this.protocol) {
        s = new WebSocket("wss://" + pathExProto);
      }
    } catch (t) {
      console.error("error: ", t);
      this.videoElement.pause();
    }
    return s;
  };

  render = () => {
    if (this.sourceBuffer) {
      if (0 !== this.buffer.length && !this.sourceBuffer.updating) {
        //console.log("buffer length: ", this.buffer.length);
        try {
          var t = this.buffer.shift();
          var s = new Uint8Array(t);
          this.sourceBuffer.appendBuffer(s);
        } catch (t) {
          console.log(t);
        }
      }
    } else {
      if (s) {
        console.log("buffer length : ", s.length);
      }
      console.log(this.sourceBuffer, "is null or undefined");
    }
  };

  alignSourceBuffer = () => {
    this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType);
    console.log("source buffer added");
    console.log("timestampOffset = " + this.sourceBuffer.timestampOffset);
    this.mediaSource.duration = 1 / 0;
    this.mediaSource.removeEventListener("sourceopen", this.alignSourceBuffer, !1);
    this.sourceBuffer.addEventListener("updateend", this.render.bind(this), !1);
    this.webSocket.send("source opened");
  };

  play = player => {
    try {
      window.MediaSource = window.MediaSource || window.WebKitMediaSource;
      if (!window.MediaSource) {
        console.error("MediaSource API is not available");
      }
      if ("MediaSource" in window) {
        if (MediaSource.isTypeSupported(player.mimeType)) {
          console.log("MIME type or codec: ", player.mimeType);
        } else {
          console.error("Unsupported MIME type or codec: ", player.mimeType);
        }
      }

      player.mediaSource = new window.MediaSource();
      //player.videoElement.autoplay = !0;
      //console.log("before set src to videoElement");
      //   player.videoElement.src({
      //     type: "video/mp4",
      //     src: window.URL.createObjectURL(player.mediaSource)
      //   });
      player.videoElement.src = URL.createObjectURL(player.mediaSource);
      console.log("after set src to videoElement");

      console.log("player paused, so start to play");
      //console.log("playerElement:", this.videoElement.el());
      this.videoElement.play().catch(err => {
        console.error(err.name);
      });

      player.mediaSource.addEventListener("sourceopen", player.alignSourceBuffer.bind(player), !1);
    } catch (player) {
      console.log(player);
    }
  };

  handleTextMessage = jsonMsg => {
    console.log("handleTextMessage");
    if (!("msgName" in jsonMsg)) {
      return;
    }

    if (jsonMsg.msgName === "mime") {
      if (!1 === this.mimeDetected) {
        this.mimeType = jsonMsg.type;
        console.log("mime dectect, " + this.mimeType);
        //console.log("playerElement1:", this.videoElement.el());
        this.play(this);
        this.mimeDetected = !0;
      }
    } else if (jsonMsg.msgName === "state") {
      //debugger;
      let state = this.videoElement.$("#sesState");

      if (state) {
        state.innerHTML = `<p>codec name: ${jsonMsg.codecName} </p> 
                <p>video quality: ${jsonMsg.width} X ${jsonMsg.height} </p>
                <p>frame rate: ${jsonMsg.frameRate}</p>
                <p>bit rate: ${jsonMsg.kbps}</p>`;
      }
    }
  };

  handleData = msg => {
    //console.log("handleData");
    if (!0 !== this.disconnected) {
      if (msg.data instanceof ArrayBuffer) {
        if (this.mimeDetected) {
          if (this.sourceBuffer.buffered.length > 0) {
            // Internet Explorer 6-11
            const isIE = !!document.documentMode;
            if (isIE) {
              const lag = this.sourceBuffer.buffered.end(0) - this.videoElement.currentTime();
              if (lag < 0.8) {
                //console.log("isIE: ", isIE);
                //console.log("playback rate: ", this.videoElement.playbackRate());

                this.videoElement.playbackRate(0.7);
                //console.log("time adjust: ", this.videoElement.currentTime(), " to ", this.sourceBuffer.buffered.end(0) - 0.5);
                //this.videoElement.currentTime(this.sourceBuffer.buffered.end(0) - 0.5);
              } else {
                this.videoElement.playbackRate(1);
              }
              //console.log("time: ", this.sourceBuffer.buffered.end(0), this.videoElement.currentTime());
            }
          }
          this.buffer.push(msg.data);
          this.render();
        }
      } else {
        this.handleTextMessages(JSON.parse(msg.data));
      }
    }
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

  releaseSourceBuffer = player => {
    console.log("Cleanup Source Buffer", player);
    if (!player.sourcBuffer) {
      player.sourceBuffer = null;
      player.mediaSource = null;
      player.buffer = [];
      return;
    }
    try {
      player.sourceBuffer.removeEventListener("updateend", player.render, !1);
      player.sourceBuffer.abort();
      if (document.documentMode || /Edge/.test(navigator.userAgent)) {
        console.log("IE or EDGE!");
      } else {
        player.mediaSource.removeSourceBuffer(player.sourceBuffer);
      }
      player.sourceBuffer = null;
      player.mediaSource = null;
      player.buffer = [];
    } catch (player) {
      console.log(player);
    }
  };

  releaseWebSocket = player => {
    clearInterval(player.keepAliveRepeat);
    clearInterval(player.closeRepeat);
    player.sourceBufferCheckCount = 0;
    player.bufferedEnd = 0;
    player.bufferedEndCheckCount = 0;
  };

  configWebSocket = () => {
    //this.videoElement.autoplay = !0;
    //console.log("playerElement2:", this.videoElement.el());
    this.webSocket = this.createWebSocket(this.path);
    this.webSocket.binaryType = "arraybuffer";
    this.webSocket.private = this;
    this.webSocket.onmessage = this.handleData.bind(this);
    this.webSocket.onopen = function() {
      this.private.closeRepeat = setInterval(this.private.close.bind(this.private), 1e4);
      this.private.keepAliveRepeat = setInterval(this.private.keepAlive.bind(this.private), 1e3);
      //console.log("onopen: ", this);
      this.private.mimeType = 'video/mp4; codecs="avc1.64001f,mp4a.40.2"; profiles="iso6,mp41"';
      this.private.mimeDetected = true;
      this.private.play(this.private);
      this.send("start");
    };
    this.webSocket.onclose = function() {
      if (0 === this.private.disconnected) {
        console.log("wsSocket.onclose disconnect");
      } else {
        this.private.connectable = !0;
      }

      this.private.releaseSourceBuffer(this.private);
      this.private.releaseWebSocket(this.private);
      this.private.mimeType = "";
      this.private.mimeDetected = !1;
    };
    //this.webSocket.send("start");
  };

  reconnect = () => {
    //console.log("Try Reconnect...", this.connectable);
    if (!0 === this.connectable) {
      console.log("Reconnect...");
      this.configWebSocket(this.token);
      this.connectable = !1;
    }
    //console.log("Try Reconnect...", this.connectable);
  };

  connect = () => {
    //console.log("playerElement3:", this.videoElement.el());
    this.configWebSocket(this.token);
    this.repeat = setInterval(this.reconnect.bind(this), 3000);
  };

  disconnect = () => {
    this.disconnected = !0;
    clearInterval(this.repeat);
    if (null != this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  };
}

export default StreamerPlayer;

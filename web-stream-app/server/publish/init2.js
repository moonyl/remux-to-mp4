//let ws = null;

// TODO: socketUrl 에 따라 다른 스트림이 전송되어야 한다.
let videoContexts = [];

class VideoContext {
  constructor(socketUrl, playerId) {
    this.ws = new WebSocket(socketUrl);
    this.ws.binaryType = "arraybuffer";

    this.fileStart = 0;
    //console.log("fileStart = ", fileStart);
    let ws = this.ws;
    ws.addEventListener("message", event => {
      event.data.fileStart = this.fileStart;
      this.fileStart = this.mp4boxfile.appendBuffer(event.data);
    });
    ws.addEventListener("error", e => {
      console.error(e);
    });
    ws.addEventListener("close", e => {
      console.log("websocket closed");
    });
    ws.addEventListener("open", e => {
      console.log("open on websocket");
      this.ws.send("start");
    });

    window.MediaSource = window.MediaSource || window.WebKitMediaSource;
    const mediaSource = new window.MediaSource();
    this.video = document.getElementById(playerId);
    this.video.src = URL.createObjectURL(mediaSource);
    this.video.ms = mediaSource;
    mediaSource.addEventListener("sourceopen", onMSEOpen);
    mediaSource.addEventListener("sourceclose", onMSEClose);
    mediaSource.addEventListener("webkitsourceopen", onMSEOpen);
    mediaSource.addEventListener("webkitsourceclose", onMSEClose);

    //videoContext.video = video;
    //videoContext.autoplay = false;
    this.autoplay = false;
  }

  start = () => {
    this.autoplay = true;
    const ms = this.video.ms;
    if (ms.readyState !== "open") {
      console.log("media source not ready");
      return;
    }

    this.mp4boxfile = MP4Box.createFile();
    console.log("mp4boxfile: ", this.mp4boxfile);
    this.mp4boxfile.onMoovStart = function() {
      console.log("Application", "Starting to parse movie information");
    };
    this.mp4boxfile.onReady = info => {
      console.log("this: ", this);
      let ms = this.video.ms;
      console.log("Application", "Movie information received");
      this.movieInfo = info;
      console.log({ info });

      if (info.isFragmented) {
        const { fragment_duration } = info;
        if (fragment_duration) {
          ms.duration = info.fragment_duration / info.timescale;
        } else {
          ms.duration = 1 / 0;
        }
      } else {
        ms.duration = info.duration / info.timescale;
      }
      addSourceBufferListener(info);
      stop();
      if (this.autoplay) {
        this.initializeAllSourceBuffers();
      }
    };
    this.mp4boxfile.onSidx = function(sidx) {
      console.log("sidx", { sidx });
    };
    this.mp4boxfile.onSegment = function(id, user, buffer, sampleNum, is_last) {
      var sb = user;
      //saveBuffer(buffer, "track-" + id + "-segment-" + sb.segmentIndex + ".m4s");
      sb.segmentIndex++;
      sb.pendingAppends.push({ id: id, buffer: buffer, sampleNum: sampleNum, is_last: is_last });
      // console.log(
      //   "Application",
      //   "Received new segment for track " +
      //     id +
      //     " up to sample #" +
      //     sampleNum +
      //     ", segments pending append: " +
      //     sb.pendingAppends.length
      // );
      onUpdateEnd.call(sb, true, false);
    };
    //this.mp4boxfile = mp4boxfile;

    // if (this.ws) {
    //   console.log("send command");
    //   this.ws.send("start");
    // }
  };

  initializeAllSourceBuffers = () => {
    if (this.movieInfo) {
      var info = this.movieInfo;
      for (var i = 0; i < info.tracks.length; i++) {
        var track = info.tracks[i];
        addBuffer(this.video, track, this.mp4boxfile);
      }
      console.log("before initializeSourceBuffers");
      initializeSourceBuffers(this.mp4boxfile, this.autoplay);
    }
  };
}

window.onload = function() {
  console.log("window onload");
  //   let context0 = new VideoContext(
  //     "ws://localhost:3001/livews/90f148c8-a487-429e-82a4-e36528fea7d5",
  //     "player0"
  //   );
  //   videoContexts.push(context0);

  let context1 = new VideoContext(
    "ws://localhost:3001/livews/80f148c8-a487-429e-82a4-e36528fea7d5",
    "player1"
  );
  videoContexts.push(context1);
  //console.log("sendCommand");
};

function onMSEOpen() {
  console.log("MSEOpen");
  sendCommand();
}

function onMSEClose() {
  console.log("MSEClose");
}

function addBuffer(video, mp4track, mp4boxfile) {
  var sb;
  var ms = video.ms;
  var track_id = mp4track.id;
  var codec = mp4track.codec;
  var mime = 'video/mp4; codecs="' + codec + '"';
  var trackDefault;
  var trackDefaultSupport = typeof TrackDefault !== "undefined";
  var html5TrackKind = "";

  if (trackDefaultSupport) {
    if (mp4track.type === "video" || mp4track.type === "audio") {
      trackDefault = new TrackDefault(
        mp4track.type,
        mp4track.language,
        mp4track.name,
        [html5TrackKind],
        track_id
      );
    } else {
      trackDefault = new TrackDefault(
        "text",
        mp4track.language,
        mp4track.name,
        [html5TrackKind],
        track_id
      );
    }
  }
  if (MediaSource.isTypeSupported(mime)) {
    try {
      console.log("MSE - SourceBuffer #" + track_id, "Creation with type '" + mime + "'");
      sb = ms.addSourceBuffer(mime);
      if (trackDefaultSupport) {
        sb.trackDefaults = new TrackDefaultList([trackDefault]);
      }
      sb.addEventListener("error", function(e) {
        Log.error("MSE SourceBuffer #" + track_id, e);
      });
      sb.ms = ms;
      sb.id = track_id;
      mp4boxfile.setSegmentOptions(track_id, sb, { nbSamples: 1 });
      //mp4boxfile.setSegmentOptions(track_id, sb);
      sb.pendingAppends = [];
    } catch (e) {
      Log.error(
        "MSE - SourceBuffer #" + track_id,
        "Cannot create buffer with type '" + mime + "'" + e
      );
    }
  } else {
    Log.warn(
      "MSE",
      "MIME type '" +
        mime +
        "' not supported for creation of a SourceBuffer for track id " +
        track_id
    );
    var i;
    var foundTextTrack = false;
    for (i = 0; i < video.textTracks.length; i++) {
      var track = video.textTracks[i];
      if (track.label === "track_" + track_id) {
        track.mode = "showing";
        track.div.style.display = "inline";
        foundTextTrack = true;
        break;
      }
    }
    if (!foundTextTrack && html5TrackKind !== "") {
      var texttrack = video.addTextTrack(html5TrackKind, mp4track.name, mp4track.language);
      texttrack.id = track_id;
      texttrack.mode = "showing";
      mp4boxfile.setExtractionOptions(track_id, texttrack, {
        nbSamples: parseInt(extractionSizeLabel.value)
      });
      texttrack.codec = codec;
      texttrack.mime = codec.substring(codec.indexOf(".") + 1);
      texttrack.mp4kind = mp4track.kind;
      texttrack.track_id = track_id;
      var div = document.createElement("div");
      div.id = "overlay_track_" + track_id;
      div.setAttribute("class", "overlay");
      overlayTracks.appendChild(div);
      texttrack.div = div;
      initTrackViewer(texttrack);
    }
  }
}

function addSourceBufferListener(info) {
  for (var i = 0; i < info.tracks.length; i++) {
    var track = info.tracks[i];
    console.log(track);
  }
}

// function initializeAllSourceBuffers() {
//   const { movieInfo, video, mp4boxfile } = videoContexts[0];
//   if (movieInfo) {
//     var info = movieInfo;
//     for (var i = 0; i < info.tracks.length; i++) {
//       var track = info.tracks[i];
//       addBuffer(video, track, mp4boxfile);
//     }
//     console.log("before initializeSourceBuffers");
//     initializeSourceBuffers();
//   }
// }

function onInitAppended(mp4boxfile, autoplay, e) {
  //console.log({ autoplay });
  var sb = e.target;
  if (sb.ms.readyState === "open") {
    sb.sampleNum = 0;
    sb.removeEventListener("updateend", onInitAppended);
    sb.addEventListener("updateend", onUpdateEnd.bind(sb, true, true));
    /* In case there are already pending buffers we call onUpdateEnd to start appending them*/
    onUpdateEnd.call(sb, false, true);
    sb.ms.pendingInits--;
    if (autoplay && sb.ms.pendingInits === 0) {
      console.log("mp4boxfile start");
      mp4boxfile.start();
    }
  }
}

function onUpdateEnd(isNotInit, isEndOfAppend) {
  if (isEndOfAppend === true) {
    if (isNotInit === true) {
      //console.log("updateBufferedString maybe called");
      //NOTE: 상태를 나타내는 부분인듯. 필요없다.
      //updateBufferedString(this, "Update ended");
    }
    if (this.sampleNum) {
      videoContexts[0].mp4boxfile.releaseUsedSamples(this.id, this.sampleNum);
      delete this.sampleNum;
    }
    if (this.is_last) {
      this.ms.endOfStream();
    }
  }
  // console.log(
  //   "ms = ",
  //   this.ms,
  //   "reayState = ",
  //   this.ms.readyState,
  //   "updating = ",
  //   this.updating,
  //   "pendingAppends.length = ",
  //   this.pendingAppends.length
  // );
  if (this.ms.readyState === "open" && this.updating === false && this.pendingAppends.length > 0) {
    var obj = this.pendingAppends.shift();
    // console.log(
    //   "MSE - SourceBuffer #" + this.id,
    //   "Appending new buffer, pending: " + this.pendingAppends.length
    // );
    this.sampleNum = obj.sampleNum;
    this.is_last = obj.is_last;
    this.appendBuffer(obj.buffer);
  }
}

function initializeSourceBuffers(mp4boxfile, autoplay) {
  let initSegs = mp4boxfile.initializeSegmentation();
  console.log(initSegs);
  for (var i = 0; i < initSegs.length; i++) {
    var sb = initSegs[i].user;
    if (i === 0) {
      sb.ms.pendingInits = 0;
    }
    console.log("this is", this);
    console.log("sb is", sb);
    sb.addEventListener("updateend", onInitAppended.bind(null, mp4boxfile, autoplay));
    //sb.addEventListener("updateend", onInitAppended);
    console.log("MSE - SourceBuffer #" + sb.id, "Appending initialization data");
    sb.appendBuffer(initSegs[i].buffer);
    //saveBuffer(initSegs[i].buffer, "track-" + initSegs[i].id + "-init.mp4");
    sb.segmentIndex = 0;
    sb.ms.pendingInits++;
  }
}

function sendCommand(event) {
  console.log("this: ", this);
  for (context of videoContexts) {
    context.start();
  }
  //videoContexts[0].start();
}

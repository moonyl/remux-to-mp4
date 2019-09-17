let ws = null;
let video = null;
let mp4boxfile = null;
let autoplay = false;

// TODO: socketUrl 에 따라 다른 스트림이 전송되어야 한다.
window.onload = function() {
  console.log("window onload");
  const socketUrl = "ws://localhost:3001/livews/80f148c8-a487-429e-82a4-e36528fea7d5";

  ws = new WebSocket(socketUrl);
  ws.binaryType = "arraybuffer";

  window.MediaSource = window.MediaSource || window.WebKitMediaSource;
  const mediaSource = new this.MediaSource();
  video = document.getElementById("player");
  video.src = URL.createObjectURL(mediaSource);
  video.ms = mediaSource;
  mediaSource.addEventListener("sourceopen", onMSEOpen);
  mediaSource.addEventListener("sourceclose", onMSEClose);
  mediaSource.addEventListener("webkitsourceopen", onMSEOpen);
  mediaSource.addEventListener("webkitsourceclose", onMSEClose);

  let fileStart = 0;
  //console.log("fileStart = ", fileStart);
  ws.addEventListener("message", event => {
    //console.log("event.data:", event.data);
    //console.log(e)
    //console.log("fileStart = ", fileStart);
    event.data.fileStart = fileStart;
    fileStart = mp4boxfile.appendBuffer(event.data);
    //console.log("mp4boxfile append", event.data.byteLength);
  });
  ws.addEventListener("error", e => {
    console.error(e);
  });
};

function onMSEOpen() {
  console.log("MSEOpen");

  //onReady();
  //addSourceBufferListener();
}

function onMSEClose() {
  console.log("MSEClose");
}

function addBuffer(video, mp4track) {
  var sb;
  var ms = video.ms;
  var track_id = mp4track.id;
  var codec = mp4track.codec;
  var mime = 'video/mp4; codecs="' + codec + '"';
  //var kind = mp4track.kind;
  var trackDefault;
  var trackDefaultSupport = typeof TrackDefault !== "undefined";
  var html5TrackKind = "";
  // NOTE: 앞으로도 아마 필요없을 것이다.
  // if (codec == "wvtt") {
  //   if (!kind.schemeURI.startsWith("urn:gpac:")) {
  //     html5TrackKind = "subtitles";
  //   } else {
  //     html5TrackKind = "metadata";
  //   }
  // } else {
  //   if (kind && kind.schemeURI === "urn:w3c:html5:kind") {
  //     html5TrackKind = kind.value || "";
  //   }
  // }
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
      mp4boxfile.setSegmentOptions(track_id, sb, { nbSamples: 10 });
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

    // checkBox.addEventListener("change", (function (t) {
    // 	return function (e) {
    // 		var check = e.target;
    // 		if (check.checked) {
    // 			addBuffer(video, t);
    // 			initButton.disabled = false;
    // 			initAllButton.disabled = true;
    // 		} else {
    // 			initButton.disabled = removeBuffer(video, t.id);
    // 			initAllButton.disabled = initButton.disabled;
    // 		}
    // 	};
    // })(track));
  }
}

function initializeAllSourceBuffers() {
  console.log({ movieInfo });
  if (movieInfo) {
    var info = movieInfo;
    for (var i = 0; i < info.tracks.length; i++) {
      var track = info.tracks[i];
      addBuffer(video, track);
      //var checkBox = document.getElementById("addTrack" + track.id);
      //checkBox.checked = true;
    }
    console.log("before initializeSourceBuffers");
    initializeSourceBuffers();
  }
}

// NOTE: 아마 DataStream은 테스트용인 듯.
// let saveChecked = {};
// saveChecked.checked = false;
// function saveBuffer(buffer, name) {
//   if (saveChecked.checked) {
//     console.log("access DataStream");
//     var d = new DataStream(buffer);
//     d.save(name);
//   }
// }

function onInitAppended(e) {
  var sb = e.target;
  if (sb.ms.readyState === "open") {
    // NOTE: 상태를 표시해주는 기능이므로 제거할 수 있다.
    //updateBufferedString(sb, "Init segment append ended");
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
      mp4boxfile.releaseUsedSamples(this.id, this.sampleNum);
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

function initializeSourceBuffers() {
  let initSegs = mp4boxfile.initializeSegmentation();
  console.log(initSegs);
  for (var i = 0; i < initSegs.length; i++) {
    var sb = initSegs[i].user;
    if (i === 0) {
      sb.ms.pendingInits = 0;
    }
    sb.addEventListener("updateend", onInitAppended);
    console.log("MSE - SourceBuffer #" + sb.id, "Appending initialization data");
    sb.appendBuffer(initSegs[i].buffer);
    //saveBuffer(initSegs[i].buffer, "track-" + initSegs[i].id + "-init.mp4");
    sb.segmentIndex = 0;
    sb.ms.pendingInits++;
  }
  // NOTE : 불필요한 부분이다.
  //initAllButton.disabled = true;
  //initButton.disabled = true;
}

function sendCommand(event) {
  autoplay = true;
  const ms = video.ms;
  if (ms.readyState !== "open") {
    console.log("media source not ready");
    return;
  }

  mp4boxfile = MP4Box.createFile();
  mp4boxfile.onMoovStart = function() {
    console.log("Application", "Starting to parse movie information");
  };
  mp4boxfile.onReady = function(info) {
    let ms = video.ms;
    console.log("Application", "Movie information received");
    movieInfo = info;
    console.log({ movieInfo });

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
    //displayMovieInfo(info, infoDiv);
    addSourceBufferListener(info);
    stop();
    if (autoplay) {
      initializeAllSourceBuffers();
    }
    // else {
    //   initAllButton.disabled = false;
    // }
  };
  mp4boxfile.onSegment = function(id, user, buffer, sampleNum, is_last) {
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

  if (ws) {
    console.log("send command");
    ws.send("start");
  }
}

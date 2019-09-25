// TODO: socketUrl 에 따라 다른 스트림이 전송되어야 한다.
let videoContexts = [];

const configSocket = (ws, onMessage) => {
  ws.binaryType = "arraybuffer";

  ws.addEventListener("message", event => {
    onMessage(event.data);
  });
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
};

const configMediaSource = mediaSource => {
  mediaSource.addEventListener("sourceopen", onMSEOpen);
  mediaSource.addEventListener("sourceclose", onMSEClose);
  mediaSource.addEventListener("webkitsourceopen", onMSEOpen);
  mediaSource.addEventListener("webkitsourceclose", onMSEClose);
};

const configVideo = (video, mediaSource) => {
  video.src = URL.createObjectURL(mediaSource);
  console.log("currentTime: ", video.currentTime);
  video.ms = mediaSource;
  console.log("ms: ", video.ms);
};

const configMp4boxfile = (mp4boxfile, onReady, onSegment) => {
  console.log("mp4boxfile: ", this.mp4boxfile);
  mp4boxfile.onMoovStart = function() {
    console.log("Application", "Starting to parse movie information");
  };
  mp4boxfile.onReady = onReady;
  mp4boxfile.onSidx = function(sidx) {
    console.log("sidx", { sidx });
  };
  mp4boxfile.onSegment = onSegment;
};

const onReady = (onInfoUpdated, mediaSource, autoplay, initializeAllSourceBuffers, info) => {
  console.log("this: ", this);
  //let ms = this.video.ms;
  let ms = mediaSource;

  console.log("Application", "Movie information received");
  //this.movieInfo = info;
  onInfoUpdated(info);
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
  //stop();
  if (autoplay) {
    initializeAllSourceBuffers();
  }
};

const onSegment = (mp4boxfile, id, user, buffer, sampleNum, is_last) => {
  var sb = user;
  sb.segmentIndex++;
  sb.pendingAppends.push({ id: id, buffer: buffer, sampleNum: sampleNum, is_last: is_last });
  onUpdateEnd.call(sb, true, false, mp4boxfile);
};

class VideoContext {
  constructor(socketUrl, playerId) {
    this.ws = new WebSocket(socketUrl);
    this.fileStart = 0;
    configSocket(this.ws, data => {
      data.fileStart = this.fileStart;
      this.fileStart = this.mp4boxfile.appendBuffer(data);
    });

    window.MediaSource = window.MediaSource || window.WebKitMediaSource;
    const mediaSource = new window.MediaSource();
    configMediaSource(mediaSource);

    this.video = document.getElementById(playerId);
    configVideo(this.video, mediaSource);

    this.autoplay = false;
  }

  onInfoUpdated = info => {
    this.movieInfo = info;
  };

  start = () => {
    this.autoplay = true;
    const ms = this.video.ms;
    if (ms.readyState !== "open") {
      console.log("media source not ready");
      return;
    }

    this.mp4boxfile = MP4Box.createFile();

    configMp4boxfile(
      this.mp4boxfile,
      onReady.bind(
        null,
        this.onInfoUpdated,
        this.video.ms,
        this.autoplay,
        this.initializeAllSourceBuffers
      ),
      onSegment.bind(null, this.mp4boxfile)
    );
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

  videoContexts.push(
    new VideoContext("ws://localhost:3001/livews/90f148c8-a487-429e-82a4-e36528fea7d5", "player0")
  );
  videoContexts.push(
    new VideoContext("ws://localhost:3001/livews/80f148c8-a487-429e-82a4-e36528fea7d5", "player1")
  );
  // videoContexts.push(
  //   new VideoContext("ws://localhost:3001/livews/90f148c8-a487-429e-82a4-e36528fea7d5", "player2")
  // );
  // videoContexts.push(
  //   new VideoContext("ws://localhost:3001/livews/80f148c8-a487-429e-82a4-e36528fea7d5", "player3")
  // );
  //console.log("sendCommand");
};

function sendCommand(event) {
  console.log("this: ", this);
  for (context of videoContexts) {
    context.start();
  }
}

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
  }
}

function addSourceBufferListener(info) {
  for (var i = 0; i < info.tracks.length; i++) {
    var track = info.tracks[i];
    console.log(track);
  }
}

function onInitAppended(mp4boxfile, autoplay, e) {
  //console.log({ autoplay });
  var sb = e.target;
  if (sb.ms.readyState === "open") {
    sb.sampleNum = 0;
    sb.removeEventListener("updateend", onInitAppended);
    sb.addEventListener("updateend", onUpdateEnd.bind(sb, true, true, mp4boxfile));
    /* In case there are already pending buffers we call onUpdateEnd to start appending them*/
    onUpdateEnd.call(sb, false, true, mp4boxfile);
    sb.ms.pendingInits--;
    if (autoplay && sb.ms.pendingInits === 0) {
      console.log("mp4boxfile start");
      mp4boxfile.start();
    }
  }
}

function onUpdateEnd(isNotInit, isEndOfAppend, mp4boxfile) {
  if (isEndOfAppend === true) {
    //console.log("onUpdateEnd, this: ", this);
    if (this.sampleNum) {
      mp4boxfile.releaseUsedSamples(this.id, this.sampleNum);
      delete this.sampleNum;
    }
    if (this.is_last) {
      this.ms.endOfStream();
    }
  }

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

    sb.addEventListener("updateend", onInitAppended.bind(null, mp4boxfile, autoplay));
    sb.appendBuffer(initSegs[i].buffer);
    sb.segmentIndex = 0;
    sb.ms.pendingInits++;
  }
}

function timeshift(event) {
  let video = document.getElementById("player0");
  video.currentTime += 1;
  video = document.getElementById("player1");
  video.currentTime += 1;
}

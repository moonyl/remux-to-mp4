import { TrackDefault, TrackDefaultList } from "mp4box";
import {
  createWStreamerClientSocket,
  createMediaSource,
  getVideoElement,
  createMp4boxfile
} from "./wsStreamerClient";

class VideoContext {
  constructor(socketUrl, playerId) {
    const mediaSource = createMediaSource(onMSEOpen.bind(this), onMSEClose.bind(this));

    this.video = getVideoElement(playerId, mediaSource);

    this.fileStart = 0;
    this.startPts = -1;

    this.ws = createWStreamerClientSocket(socketUrl, this.onMessage);
    this.autoplay = false;
  }

  onMessage = data => {
    if (typeof data === "string") {
      const info = JSON.parse(data);
      console.log("info =", { info });
      const { pts } = info;
      //console.log({ pts });
      if (pts) {
        console.log("cpt: ", { pts });
        this.startPts = pts;
      }
      //console.log(info);
      return;
    }
    data.fileStart = this.fileStart;
    this.fileStart = this.mp4boxfile.appendBuffer(data);

    if (this.video.paused) {
      if (this.startPts > 0) {
        this.video.currentTime = this.startPts;
      }
      if (!this.video.autoplay) {
        this.video.autoplay = true;
      }

      console.log("autoplay on");
    }
  };

  onInfoUpdated = info => {
    this.movieInfo = info;
  };

  onSegment = (id, user, buffer, sampleNum, is_last) => {
    var sb = user;
    sb.segmentIndex++;
    sb.pendingAppends.push({ id: id, buffer: buffer, sampleNum: sampleNum, is_last: is_last });
    onUpdateEnd.call(sb, true, false, this.mp4boxfile);
  };

  onReady = info => {
    console.log("this: ", this);
    let ms = this.video.ms;

    console.log("Application", "Movie information received");
    //this.movieInfo = info;
    this.onInfoUpdated(info);
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
    if (this.autoplay) {
      this.initializeAllSourceBuffers();
    }
  };

  start = () => {
    this.autoplay = true;
    const ms = this.video.ms;
    if (ms.readyState !== "open") {
      console.log("media source not ready");
      return;
    }

    this.mp4boxfile = createMp4boxfile(this.onReady, this.onSegment);

    console.log("cpt before call play");
    //console.log("cpt startPts: ", this.startPts);
    if (this.startPts > 0) {
      console.log("cpt set startPts: ", this.startPts);
      this.video.currentTime = this.startPts;
    }
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

function onMSEOpen() {
  console.log("MSEOpen");
  //console.log("this=", this);
  this.start();
  //sendCommand();
}

function onMSEClose() {
  console.log("MSEClose");
  this.ws.close();
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
        console.error("MSE SourceBuffer #" + track_id, e);
      });
      sb.ms = ms;
      sb.id = track_id;
      mp4boxfile.setSegmentOptions(track_id, sb, { nbSamples: 1 });
      //mp4boxfile.setSegmentOptions(track_id, sb);
      sb.pendingAppends = [];
    } catch (e) {
      console.error(
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

export default VideoContext;

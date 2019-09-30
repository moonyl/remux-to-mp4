import MP4Box from "mp4box";

const createWStreamerClientSocket = (socketUrl, onMessage) => {
  const ws = new WebSocket(socketUrl);
  ws.binaryType = "arraybuffer";

  ws.addEventListener("message", event => {
    //console.log(typeof event.data);
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
  return ws;
};

const createMediaSource = (onMSEOpen, onMSEClose) => {
  window.MediaSource = window.MediaSource || window.WebKitMediaSource;
  const mediaSource = new window.MediaSource();
  mediaSource.addEventListener("sourceopen", onMSEOpen);
  mediaSource.addEventListener("sourceclose", onMSEClose);
  mediaSource.addEventListener("webkitsourceopen", onMSEOpen);
  mediaSource.addEventListener("webkitsourceclose", onMSEClose);
  return mediaSource;
};

const getVideoElement = (playerId, mediaSource) => {
  const video = document.getElementById(playerId);
  video.src = URL.createObjectURL(mediaSource);
  video.ms = mediaSource;
  return video;
};

const createMp4boxfile = (onReady, onSegment) => {
  const mp4boxfile = MP4Box.createFile();
  console.log("mp4boxfile: ", mp4boxfile);
  mp4boxfile.onMoovStart = function() {
    console.log("Application", "Starting to parse movie information");
  };
  mp4boxfile.onReady = onReady;
  mp4boxfile.onSidx = function(sidx) {
    console.log("sidx", { sidx });
  };
  mp4boxfile.onSegment = onSegment;
  return mp4boxfile;
};

export { createWStreamerClientSocket, createMediaSource, getVideoElement, createMp4boxfile };

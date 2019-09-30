import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import StreamsDrawer from "./components/StreamsDrawer";
import VideoPlayer from "@moonyl/react-video-js-player";
import VideoContext from "./utils/VideoContext";

const useStyles = makeStyles(theme => ({
  app: {
    position: "fixed",
    top: theme.overrides.heightOffset,
    left: theme.overrides.drawerWidth,
    width: "75%"
  },
  videoArea: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr"
  }
}));

const MonitorApp = props => {
  const classes = useStyles();
  const [streamIds, setStreamIds] = useState([]);
  const [videoContexts, setVideoContexts] = useState([]);
  const onViewStream = id => event => {
    //console.log({ id });
    setStreamIds([...streamIds, id]);
  };
  const onVideoReady = streamId => player => {
    console.log({ streamId, player });
    const videoElement = player.children()[0];
    console.log(videoElement.id);
    const playerId = videoElement.id;
    const url = `ws://localhost:3001/livews/${streamId}`;
    console.log("before video Context");
    setVideoContexts([...videoContexts, new VideoContext(url, playerId)]);
    console.log("after video Context");
    //player.fluid(true);
    player.aspectRatio("16:9");
    //player.play();
    //videoElement.play();
  };

  return (
    <div className={classes.app}>
      <h1>감시</h1>
      <div className={classes.videoArea}>
        {streamIds.map(streamId => {
          //console.log({ streamId });
          return (
            <>
              <VideoPlayer key={streamId} onReady={onVideoReady(streamId)} />
            </>
          );
        })}
      </div>
      <StreamsDrawer onViewStream={onViewStream} />
    </div>
  );
};

export default MonitorApp;

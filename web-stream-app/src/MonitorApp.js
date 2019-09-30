import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import StreamsDrawer from "./components/StreamsDrawer";
import VideoPlayer from "@moonyl/react-video-js-player";
import VideoContext from "./utils/VideoContext";
import { Card, CardContent, CardActions, Typography, Button } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  app: {
    position: "fixed",
    top: theme.overrides.heightOffset,
    left: theme.overrides.drawerWidth,
    width: "75%"
  },
  videoArea: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr"
  },
  titleNClose: {
    display: "flex"
  },
  title: {
    flexGrow: 1
  },
  closeButton: {
    flexGrow: 0
  }
}));

const MonitorApp = props => {
  const classes = useStyles();
  const [streamIds, setStreamIds] = useState([]);
  const [videoContexts, setVideoContexts] = useState({});

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
    setVideoContexts({ ...videoContexts, [streamId]: new VideoContext(url, playerId) });
    console.log("after video Context");
    //player.fluid(true);
    player.aspectRatio("16:9");
    //player.play();
    //videoElement.play();
  };

  const onVideoClose = streamId => event => {
    console.log({ videoContexts });
    delete videoContexts[streamId];
    setVideoContexts({ ...videoContexts });
    const idx = streamIds.findIndex(item => item === streamId);
    streamIds.splice(idx, 1);
    setStreamIds(streamIds);
  };

  return (
    <div className={classes.app}>
      <h1>감시</h1>
      <div className={classes.videoArea}>
        {streamIds.map(streamId => {
          //console.log({ streamId });
          return (
            <Card>
              <CardContent>
                <div className={classes.titleNClose}>
                  <Typography className={classes.title} variant="subtitle1">
                    Live From Space
                  </Typography>
                  <CardActions className={classes.closeButton}>
                    <Button variant="contained" color="primary" onClick={onVideoClose(streamId)}>
                      X
                    </Button>
                  </CardActions>
                </div>
              </CardContent>
              <VideoPlayer key={streamId} onReady={onVideoReady(streamId)} />
            </Card>
          );
        })}
      </div>
      <StreamsDrawer onViewStream={onViewStream} />
    </div>
  );
};

export default MonitorApp;

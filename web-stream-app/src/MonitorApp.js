import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import StreamsDrawer from "./components/StreamsDrawer";
import VideoPlayer from "@moonyl/react-video-js-player";

const useStyles = makeStyles(theme => ({
  app: {
    position: "fixed",
    top: theme.overrides.heightOffset,
    left: theme.overrides.drawerWidth
  }
}));

const MonitorApp = props => {
  const classes = useStyles();
  const [streamIds, setStreamIds] = useState([]);
  const onViewStream = id => event => {
    //console.log({ id });
    setStreamIds([...streamIds, id]);
  };
  const onVideoReady = streamId => player => {
    console.log({ streamId, player });
  };

  return (
    <div className={classes.app}>
      <h1>감시</h1>
      {streamIds.map(streamId => {
        //console.log({ streamId });
        return <VideoPlayer onReady={onVideoReady(streamId)} />;
      })}
      <StreamsDrawer onViewStream={onViewStream} />
    </div>
  );
};

export default MonitorApp;

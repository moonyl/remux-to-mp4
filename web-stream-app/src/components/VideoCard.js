import React from "react";
//import VideoPlayer from "@moonyl/react-video-js-player";
import { Card, CardContent, CardActions, Typography, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import StreamVideoNew from "./StreamVideoNew";

const useStyles = makeStyles(theme => ({
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

const VideoCard = ({ displayInfo, onVideoClose, volumeMute }) => {
  const classes = useStyles();
  console.log("videoCard:", { displayInfo });
  return (
    <Card>
      <CardContent>
        <div className={classes.titleNClose}>
          <Typography className={classes.title} variant="subtitle1">
            {displayInfo.title}
          </Typography>
          <CardActions className={classes.closeButton}>
            <Button variant="contained" color="primary" onClick={onVideoClose(displayInfo.id)}>
              X
            </Button>
          </CardActions>
        </div>
      </CardContent>
      {/* <VideoPlayer key={displayInfo.id} onReady={onVideoReady(displayInfo.id)} /> */}
      <StreamVideoNew path={`livews/${displayInfo.id}`} volumeMute={volumeMute} />
    </Card>
  );
};

export default VideoCard;

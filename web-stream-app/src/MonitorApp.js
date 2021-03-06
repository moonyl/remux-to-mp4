import React from "react";
import StreamsDrawer from "./components/StreamsDrawer";
import VideoContext from "./utils/VideoContext";
import withStyles from "@material-ui/core/styles/withStyles";
import VideoCard from "./components/VideoCard";

import AudioSelect from "./components/AudioSelect";

const styles = theme => ({
  app: {
    position: "relative",
    top: theme.overrides.heightOffset,
    left: theme.overrides.drawerWidth,
    width: "75%"
  },
  videoArea: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr"
  }
});

class MonitorApp extends React.Component {
  state = {
    streamDisplayInfos: [],
    videoContexts: {},
    streams: [],
    audioSelect: 0
  };

  componentDidMount() {
    //console.log("monitor app");
    fetch("/api/stream")
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then(data => {
        const { state, result } = data;
        if (state === "OK") {
          this.setState({ loading: false, streams: result });
          return;
        }
      })
      .catch(error => this.setState({ loading: false, error }));
  }

  onViewStream = info => event => {
    this.setState({ streamDisplayInfos: [...this.state.streamDisplayInfos, info] });
  };

  onVideoReady = streamId => player => {
    const videoElement = player.children()[0];
    const playerId = videoElement.id;
    const url = `ws://localhost:3001/livews/${streamId}`;
    this.setState({
      videoContexts: { ...this.state.videoContexts, [streamId]: new VideoContext(url, playerId) }
    });
    player.aspectRatio("16:9");
  };

  onVideoClose = streamId => event => {
    const filtered = this.state.streamDisplayInfos.filter(info => {
      if (info.id === streamId) {
        return false;
      }
      return true;
    });
    // let filtered = [...this.state.streamDisplayInfos];
    // filtered.splice(index, 1);
    this.setState({ streamDisplayInfos: filtered });
  };

  onAudioSelect = event => {
    //console.log("audio select: ", event.target.value);
    const { value } = event.target;
    this.setState({ audioSelect: value });
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.app}>
        <AudioSelect
          select={this.state.audioSelect}
          onSelect={this.onAudioSelect}
          displayInfos={this.state.streamDisplayInfos}
        />

        <div className={classes.videoArea}>
          {this.state.streamDisplayInfos.map(displayInfo => {
            //console.log({ displayInfo });
            return (
              <VideoCard
                key={displayInfo.id}
                displayInfo={displayInfo}
                onVideoClose={this.onVideoClose}
                onVideoReady={this.onVideoReady}
                volumeMute={displayInfo.id !== this.state.audioSelect}
              />
            );
          })}
        </div>
        <StreamsDrawer
          onViewStream={this.onViewStream}
          loading={this.state.loading}
          error={this.state.error}
          data={this.state.streams}
        />
      </div>
    );
  }
}

export default withStyles(styles)(MonitorApp);

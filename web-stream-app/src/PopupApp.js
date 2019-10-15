import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import StreamVideoNew from "./components/StreamVideoNew";

const styles = theme => ({
  app: {
    position: "relative",
    top: theme.overrides.heightOffset
  }
});

class PopupApp extends React.Component {
  state = {
    streamId: ""
  };
  componentDidMount() {
    const { hid } = this.props.match.params;
    console.log({ hid });
    const route = `/api/stream-id/${hid}`;
    fetch(route)
      .then(reply => {
        return reply.json();
      })
      .then(result => {
        const { state, result: value } = result;
        if (state === "OK") {
          const { id } = value;
          this.setState({ streamId: id });
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  render() {
    const { classes } = this.props;
    const { streamId } = this.state;
    return (
      <div className={classes.app}>
        {streamId && <StreamVideoNew path={`livews/${streamId}`} volumeMute={false} />}
      </div>
    );
  }
}

export default withStyles(styles)(PopupApp);

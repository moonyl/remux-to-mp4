import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import PopupsTable from "./components/PopupsTable";
import { Redirect } from "react-router-dom";

const styles = theme => ({
  app: {
    position: "relative",
    top: theme.overrides.heightOffset
  }
});

class HidStreamApp extends React.Component {
  state = {
    popups: [],
    moveTo: ""
  };

  componentDidMount() {
    this.findAllStream();
  }

  findAllStream = () => {
    this.setState({ openEdit: false });
    const route = "/api/stream";
    fetch(route)
      .then(reply => {
        return reply.json();
      })
      .then(result => {
        const { state, result: streams } = result;
        if (state === "OK") {
          console.log({ streams });
          const popups = streams
            .filter(stream => {
              const { streamInfo } = stream;
              const { hid } = streamInfo;
              //console.log({ hid });
              return hid !== undefined;
            })
            .map(popup => {
              //console.log({ stream });
              const { streamId, streamInfo } = popup;
              const { hid, title } = streamInfo;
              const { host } = window.location;
              const url = host + "/view/" + hid;
              //const url = "/view/" + hid;
              return { id: streamId, url, hid, title };
            });

          this.setState({ popups });
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  onPopupView = hid => event => {
    this.setState({ moveTo: `/view/${hid}` });
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.app}>
        <PopupsTable popups={this.state.popups} onView={this.onPopupView} />
        {this.state.moveTo && <Redirect to={this.state.moveTo} />}
      </div>
    );
  }
}

export default withStyles(styles)(HidStreamApp);

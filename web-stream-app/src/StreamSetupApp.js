import React from "react";
import Button from "@material-ui/core/Button";
import StreamEditDialog from "./components/StreamEditDialog";
import StreamsTable from "./components/StreamsTable";
import withStyles from "@material-ui/core/styles/withStyles";

const styles = theme => ({
  app: {
    position: "fixed",
    top: theme.overrides.heightOffset
  }
});

class StreamSetupApp extends React.Component {
  state = {
    open: false,
    streamId: "",
    streamInfo: {
      type: "rtsp",
      service: "",
      profiles: [],
      profileSel: 0,
      url: "",
      user: "",
      password: ""
    },
    streams: []
  };

  onCancel = () => {
    this.setState({ open: false });
  };

  onSave = () => {
    this.setState({ open: false });
    console.log("location: ", window.location.origin);
    const route = `${window.location.origin}/api/setupStream`;
    const { streamId, streamInfo } = this.state;
    const setting = { streamId, streamInfo };
    fetch(route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(setting)
    })
      .then(result => {
        console.log(result);
      })
      .catch(error => {
        console.error(error);
      });
  };

  findAllStream = () => {
    this.setState({ open: false });
    //console.log("location: ", window.location.origin);
    const route = `${window.location.origin}/api/streamAll`;
    fetch(route)
      .then(reply => {
        return reply.json();
      })
      .then(result => {
        const { state, result: streams } = result;
        if (state === "OK") {
          const tableData = streams.map(stream => {
            const { streamId, streamInfo } = stream;
            return { id: streamId, ...streamInfo };
          });
          this.setState({ streams, tableData });
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  onAuth = () => {
    console.log("should implement auth");
  };

  addStream = () => {
    //console.log("handleClickOpen");
    this.setState({ open: true, streamId: "", streamInfo: { type: "rtsp" } });
  };

  editStream = () => {
    // steramInfo를 읽어들인다.
    let streamId = "abcdefg";
    let streamInfo = {
      type: "onvif",
      service: "",
      profiles: [],
      profileSel: 0,
      url: "",
      user: "",
      password: ""
    };
    this.setState({ open: true, streamId, streamInfo });
  };

  onValueChange = name => event => {
    const { value } = event.target;
    //console.log({ name, value });
    const { streamInfo } = this.state;
    if (name === "type") {
      this.setState({ streamInfo: { ...streamInfo, type: value } });
    } else if (name === "title") {
      this.setState({ streamInfo: { ...streamInfo, title: value } });
    } else if (name === "service") {
      this.setState({ streamInfo: { ...streamInfo, service: value } });
    } else if (name === "profileSel") {
      this.setState({ streamInfo: { ...streamInfo, profileSel: value } });
    } else if (name === "url") {
      this.setState({ streamInfo: { ...streamInfo, url: value } });
    } else if (name === "user") {
      this.setState({ streamInfo: { ...streamInfo, user: value } });
    } else if (name === "password") {
      this.setState({ streamInfo: { ...streamInfo, password: value } });
    }
  };

  render() {
    const { streamInfo } = this.state;
    const { classes } = this.props;
    console.log("state: ", this.state);

    return (
      <div className={classes.app}>
        <Button variant="outlined" color="primary" onClick={this.addStream}>
          Add stream
        </Button>
        <Button variant="outlined" color="primary" onClick={this.editStream}>
          Edit stream
        </Button>
        <Button variant="outlined" color="primary" onClick={this.findAllStream}>
          Find All Stream
        </Button>
        <StreamsTable streams={this.state.tableData} />
        <StreamEditDialog
          {...streamInfo}
          profileLoading={false}
          open={this.state.open}
          onCancel={this.onCancel}
          onSave={this.onSave}
          onAuth={this.onAuth}
          onValueChange={this.onValueChange}
        />
      </div>
    );
  }
}

export default withStyles(styles)(StreamSetupApp);

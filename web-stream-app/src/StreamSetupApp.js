import React from "react";
import Button from "@material-ui/core/Button";
import StreamEditDialog from "./components/StreamEditDialog";
import withStyles from "@material-ui/core/styles/withStyles";
import StreamsTable from "./components/StreamsTable";

const styles = theme => ({
  app: {
    position: "relative",
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
    const route = "/api/stream";
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

  componentDidMount() {
    this.findAllStream();
  }

  findAllStream = () => {
    this.setState({ open: false });
    const route = "/api/stream";
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

    this.setState({ streamInfo: { ...streamInfo, [name]: value } });
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
          update
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

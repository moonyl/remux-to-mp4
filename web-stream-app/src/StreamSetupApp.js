import React from "react";
import Button from "@material-ui/core/Button";
import StreamEditDialog from "./components/StreamEditDialog";
import withStyles from "@material-ui/core/styles/withStyles";
import StreamsTable from "./components/StreamsTable";
import DiscoveryDialog from "./components/DiscoveryDialog";

const styles = theme => ({
  app: {
    position: "relative",
    top: theme.overrides.heightOffset
  }
});

class StreamSetupApp extends React.Component {
  state = {
    openEdit: false,
    streamId: "",
    streamInfo: {
      type: "rtsp",
      service: "",
      profiles: [],
      profileSel: -1,
      url: "",
      user: "",
      password: "",
      profileSummmary: ""
    },
    profileLoading: false,
    streams: [],
    openDiscovery: false,
    discovered: [],
    selected: []
  };

  onCancel = () => {
    this.setState({ openEdit: false });
  };

  onSave = () => {
    this.setState({ openEdit: false });
    console.log("location: ", window.location.origin);

    const { streamId, streamInfo } = this.state;
    if (!streamId) {
      const route = "/api/stream";
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
    } else {
      const route = `/api/stream/${streamId}`;
      const selectedProfile = streamInfo.profiles[streamInfo.profileSel];
      const { name, codec, width, height, url } = selectedProfile;
      const profileSummary = `${name} (${codec}, ${width} x ${height})`;
      const param = { ...streamInfo, url, profileSummary };
      delete param.profiles;

      const setting = { cmd: "update", param };
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
    }
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

  //onAuth = streamId => event => {
  onAuth = streamId => event => {
    const { user, password } = this.state.streamInfo;
    console.log({ streamId, user, password });
    this.setState({ profileLoading: true });
    const route = "/onvif/auth";
    fetch(route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: streamId, user, password })
    })
      .then(reply => {
        return reply.json();
      })
      .then(json => {
        const { state, media, ptz } = json;
        if (state === true) {
          const { streamInfo } = this.state;
          const currentStream = { ...streamInfo };
          console.log({ currentStream });
          currentStream.profiles = media;
          currentStream.profileSel = 0;
          this.setState({ streamInfo: currentStream });
        }
        this.setState({ profileLoading: false });
      })
      .catch(error => {
        console.error(error);
      });
  };

  addStream = () => {
    //console.log("handleClickOpen");
    this.setState({ openEdit: true, streamId: "", streamInfo: { type: "rtsp" } });
  };

  onStreamEdit = id => event => {
    console.log({ id });
    console.log("streams:", this.state.streams);
    const selected = this.state.streams.find(elem => elem.streamId === id);
    const { streamInfo } = selected;

    this.setState({ openEdit: true, streamId: id, streamInfo });
  };

  discovery = () => {
    this.setState({ openDiscovery: true });
    const route = "/onvif/discovery";
    fetch(route)
      .then(reply => {
        return reply.json();
      })
      .then(json => {
        const { result } = json;
        this.setState({ discovered: result.devices });
      })
      .catch(error => {
        console.error(error);
      });
  };

  onDiscoveryAdd = selected => event => {
    console.log("selected: ", selected);
    this.setState({ openDiscovery: false });
    // TODO : 스트림을 SETUP에 추가한다.
    const route = "/api/stream";
    selected.map(item => {
      const streamInfo = {
        type: "onvif",
        service: item
      };
      const setting = { streamId: "", streamInfo };
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
    });
  };

  onDiscoveryCancel = () => {
    console.log("onDiscoveryCancel");
    this.setState({ openDiscovery: false });
  };

  onValueChange = name => event => {
    const { value } = event.target;
    //console.log({ name, value });
    const { streamInfo } = this.state;

    this.setState({ streamInfo: { ...streamInfo, [name]: value } });
  };

  deleteStream = event => {
    console.log("selected: ", this.state.selected);

    this.state.selected.forEach(item => {
      const setting = { cmd: "delete" };
      const route = `/api/stream/${item}`;
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
    });
    this.setState({ selected: [] });
  };

  onStreamSelectChange = id => event => {
    const { checked } = event.target;
    if (checked) {
      this.setState({ selected: [...this.state.selected, id] });
    } else {
      const filtered = this.state.selected.filter(item => {
        if (id === item) {
          return false;
        }
        return true;
      });
      this.setState({ selected: filtered });
    }
    console.log({ id });
    console.log(event.target.checked);
  };

  render() {
    const { streamInfo, streamId } = this.state;
    const { classes } = this.props;
    console.log("state: ", this.state);

    return (
      <div className={classes.app}>
        <Button variant="outlined" color="primary" onClick={this.addStream}>
          스트림 추가
        </Button>
        <Button variant="outlined" color="primary" onClick={this.discovery}>
          스트림 검색
        </Button>
        <Button variant="outlined" color="primary" onClick={this.deleteStream}>
          스트림 삭제
        </Button>
        <Button variant="outlined" color="primary" onClick={this.findAllStream}>
          스트림 업데이트
        </Button>
        <StreamsTable
          streams={this.state.tableData}
          onSelectChange={this.onStreamSelectChange}
          onEdit={this.onStreamEdit}
        />
        <StreamEditDialog
          {...streamInfo}
          streamId={streamId}
          profileLoading={this.state.profileLoading}
          open={this.state.openEdit}
          onCancel={this.onCancel}
          onSave={this.onSave}
          onAuth={this.onAuth}
          onValueChange={this.onValueChange}
        />
        <DiscoveryDialog
          open={this.state.openDiscovery}
          streams={this.state.discovered}
          onApply={this.onDiscoveryAdd}
          onCancel={this.onDiscoveryCancel}
        />
      </div>
    );
  }
}

export default withStyles(styles)(StreamSetupApp);

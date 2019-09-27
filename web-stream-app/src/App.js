import React from "react";
import Button from "@material-ui/core/Button";
import StreamEditDialog from "./components/StreamEditDialog";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  TableHead,
  TableSortLabel
} from "@material-ui/core";

const headRows = [
  { id: "title", numeric: false, disablePadding: false, label: "이름" },
  { id: "type", numeric: false, disablePadding: false, label: "타입" },
  { id: "url", numeric: false, disablePadding: false, label: "URL" },
  { id: "ip", numeric: false, disablePadding: false, label: "IP" },
  { id: "profile", numeric: true, disablePadding: false, label: "프로파일" }
];

const StreamTableHead = props => (
  <TableHead>
    <TableRow>
      <TableCell padding="checkbox">
        <Checkbox />
      </TableCell>
      {headRows.map(row => (
        <TableCell
          key={row.id}
          align={row.numeric ? "right" : "left"}
          padding={row.disablePadding ? "none" : "default"}
        >
          <TableSortLabel>{row.label}</TableSortLabel>
        </TableCell>
      ))}
    </TableRow>
  </TableHead>
);

const StreamsTable = ({ streams }) => {
  console.log({ streams });
  return (
    <Table>
      <StreamTableHead />
      <TableBody>
        {streams &&
          streams.map((stream, index) => (
            <TableRow key={index}>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell align="left">{stream.title}</TableCell>
              <TableCell align="left">{stream.type}</TableCell>
              <TableCell align="left">{stream.url}</TableCell>
              <TableCell align="left">{"IP"}</TableCell>
              <TableCell align="left">{"profile content"}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

class App extends React.Component {
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
    console.log("location: ", window.location.origin);
    const route = `${window.location.origin}/api/streamAll`;
    fetch(route)
      .then(reply => {
        //console.log(reply);
        return reply.json();
      })
      .then(result => {
        console.log("result: ", result);
        const { state, result: streams } = result;
        console.log("state: ", state);
        console.log("streams: ", streams);
        if (state === "OK") {
          //this.setState({ streams });
          const tableData = streams.map(stream => {
            const { streamId, streamInfo } = stream;
            return { id: streamId, ...streamInfo };
          });
          console.log({ tableData });
          this.setState({ streams, tableData });
        }
        //console.log({ state }, { streams });
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

    console.log("state: ", this.state);

    return (
      <React.Fragment>
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
      </React.Fragment>
    );
  }
}

export default App;

import React from "react";
import Button from "@material-ui/core/Button";

import Draggable from "react-draggable";
import {
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@material-ui/core";

function PaperComponent(props) {
  return (
    <Draggable>
      <Paper {...props} />
    </Draggable>
  );
}

class DraggableDialog extends React.Component {
  render() {
    return (
      <Dialog
        open={this.props.open}
        onClose={this.props.onClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle id="draggable-dialog-title">Subscribe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To subscribe to this website, please enter your email address here. We will send updates
            occasionally.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.props.onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={this.props.onClose} color="primary">
            Subscribe
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

class App extends React.Component {
  state = {
    open: false
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  addStream = () => {
    //console.log("handleClickOpen");
    this.setState({ open: true });
  };

  render() {
    return (
      <React.Fragment>
        <Button variant="outlined" color="primary" onClick={this.addStream}>
          Add stream
        </Button>
        <DraggableDialog open={this.state.open} onClose={this.handleClose} />
      </React.Fragment>
    );
  }
}

export default App;

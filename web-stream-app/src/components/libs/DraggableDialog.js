import Draggable from "react-draggable";
import React, { useState } from "react";
import { Paper, Dialog } from "@material-ui/core";

function PaperComponent(props) {
  //console.log({ props });
  //const [editable, setEditable] = useState(true);
  return (
    <Draggable
    // onMouseDown={() => {
    //   console.log("mouse down");
    //   setEditable(false);
    // }}
    // onStop={() => {
    //   console.log("set editable");
    //   setEditable(true);
    // }}
    // disabled={editable}
    >
      <Paper {...props} />
    </Draggable>
  );
}

const DraggableDialog = props => {
  const { children } = props;
  return (
    <Dialog {...props} PaperComponent={PaperComponent}>
      {children}
    </Dialog>
  );
};

export default DraggableDialog;

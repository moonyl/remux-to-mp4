import React from "react";
import { Table, TableBody, TableRow, TableCell, Fab } from "@material-ui/core";
import Videocam from "@material-ui/icons/Videocam";
import StreamTableHead from "./libs/StreamTableHead";

const headRows = [
  { id: "title", numeric: false, disablePadding: false, label: "이름" },
  { id: "url", numeric: false, disablePadding: false, label: "URL" },
  { id: "view", numeric: false, disablePadding: false, label: "보기" }
];

const PopupsTable = ({ popups, onView }) => {
  //console.log({ streams });
  return (
    <Table>
      <StreamTableHead headRows={headRows} />
      <TableBody>
        {popups &&
          popups.map((popup, index) => (
            <TableRow key={index}>
              <TableCell align="left">{popup.title}</TableCell>
              <TableCell align="left">{popup.url}</TableCell>
              <TableCell align="left">
                <Fab size="small" color="primary" onClick={onView(popup.hid)}>
                  <Videocam />
                </Fab>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

export default PopupsTable;

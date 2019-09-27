import React from "react";
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

export default StreamsTable;

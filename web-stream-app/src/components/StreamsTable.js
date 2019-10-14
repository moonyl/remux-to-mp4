import React from "react";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  TableHead,
  TableSortLabel,
  Fab
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";

const headRows = [
  { id: "title", numeric: false, disablePadding: false, label: "이름" },
  { id: "type", numeric: false, disablePadding: false, label: "타입" },
  { id: "summary", numeric: false, disablePadding: false, label: "스트림 요약" },
  { id: "edit", numeric: false, disablePadding: false, label: "편집" }
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

const StreamsTable = ({ streams, onSelectChange, onEdit }) => {
  //console.log({ streams });
  return (
    <Table>
      <StreamTableHead />
      <TableBody>
        {streams &&
          streams.map((stream, index) => (
            <TableRow key={index}>
              <TableCell padding="checkbox">
                {/* <Checkbox onChange={onSelect(stream.id)} /> */}
                <Checkbox onChange={onSelectChange(stream.id)} />
              </TableCell>
              <TableCell align="left">{stream.title}</TableCell>
              <TableCell align="left">{stream.type}</TableCell>
              {stream.type === "rtsp" ? (
                <TableCell align="left">{stream.url}</TableCell>
              ) : stream.profileSummary ? (
                <TableCell align="left">{stream.profileSummary}</TableCell>
              ) : (
                <TableCell align="left">프로파일이 설정되지 않았습니다.</TableCell>
              )}

              <TableCell align="left">
                <Fab size="small" color="primary" onClick={onEdit(stream.id)}>
                  <EditIcon />
                </Fab>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

export default StreamsTable;

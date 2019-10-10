import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TableCell,
  Checkbox,
  TableSortLabel,
  Table,
  TableBody,
  TableRow,
  TableHead,
  CircularProgress
} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  edge: {
    border: "1px solid black"
  },
  circle: {
    margin: "0 auto"
  },
  progress: {
    flex: "true",
    justifyContent: "center"
  }
}));

const headRows = [
  { id: "ip", numeric: false, disablePadding: false, label: "장치 IP" },
  { id: "model", numeric: false, disablePadding: false, label: "모델" },
  { id: "xaddr", numeric: false, disablePadding: false, label: "서비스 주소" }
];

const DiscoveryTableHead = props => (
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

const DiscoveryDialog = ({ open, onCancel, onSave, streams }) => {
  const classes = useStyles();
  return (
    <Dialog open={open} maxWidth="md">
      <DialogTitle>스트림 검색</DialogTitle>
      <DialogContent>
        <Table>
          <DiscoveryTableHead />
          <TableBody>
            {streams.length ? (
              streams.map((stream, index) => (
                <TableRow key={index}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell align="left">{stream.ip}</TableCell>
                  <TableCell align="left">{stream.model}</TableCell>
                  <TableCell align="left">{stream.xaddr}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className={classes.circle}>
                  <CircularProgress className={classes.circle} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          취소
        </Button>
        <Button onClick={onSave} color="primary">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscoveryDialog;

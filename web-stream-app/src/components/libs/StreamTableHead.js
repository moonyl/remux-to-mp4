import React from "react";
import { TableRow, TableCell, Checkbox, TableHead, TableSortLabel } from "@material-ui/core";

const StreamTableHead = ({ headRows, checkbox }) => (
  <TableHead>
    <TableRow>
      {checkbox && (
        <TableCell padding="checkbox">
          <Checkbox />
        </TableCell>
      )}
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

export default StreamTableHead;

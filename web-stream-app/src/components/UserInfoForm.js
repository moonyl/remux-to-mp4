import React from "react";

import { TextField } from "@material-ui/core";

const UserInfoForm = ({ user, password, onValueChange }) => {
  return (
    <>
      <TextField
        margin="dense"
        label="User"
        type="text"
        value={user}
        onChange={onValueChange("user")}
        fullWidth
      />
      <TextField
        margin="dense"
        label="Password"
        type="password"
        value={password}
        onChange={onValueChange("password")}
        fullWidth
      />
    </>
  );
};

export default UserInfoForm;

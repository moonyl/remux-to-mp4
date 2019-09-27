import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  app: {
    position: "fixed",
    top: theme.overrides.heightOffset
  }
}));

const LoginApp = props => {
  const classes = useStyles();
  return (
    <div className={classes.app}>
      <h1>로그인</h1>
    </div>
  );
};

export default LoginApp;

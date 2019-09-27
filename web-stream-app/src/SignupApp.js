import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  app: {
    position: "fixed",
    top: theme.overrides.heightOffset
  }
}));

const SignupApp = props => {
  const classes = useStyles();
  return (
    <div className={classes.app}>
      <h1>가입</h1>
    </div>
  );
};

export default SignupApp;

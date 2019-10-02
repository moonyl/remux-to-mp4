import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import {
  TextField,
  Checkbox,
  Button,
  Grid,
  Link,
  Container,
  Avatar,
  Typography,
  FormControlLabel
} from "@material-ui/core";
import { Redirect } from "react-router-dom";

const useStyles = makeStyles(theme => ({
  app: {
    position: "relative",
    top: theme.overrides.heightOffset
  },
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

const LoginApp = () => {
  const classes = useStyles();
  const [info, setInfo] = useState();
  const [loggedin, setLoggedin] = useState(false);

  const onSubmit = event => {
    event.preventDefault();
    console.log({ info });
    fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(info)
    })
      .then(result => {
        console.log("result: ", { result });
        return result.json();
      })
      .then(json => {
        console.log({ json });
        if (!json.success) {
          // TODO : error message
          return;
        }
        setLoggedin(true);
      })
      .catch(error => {
        console.log("error: ", { error });
      });
  };
  return (
    <Container component="main" maxWidth="xs" className={classes.app}>
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form className={classes.form} noValidate onSubmit={onSubmit}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            onChange={e => setInfo({ ...info, email: e.target.value })}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            onChange={e => setInfo({ ...info, password: e.target.value })}
          />
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Sign In
          </Button>
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link href="#" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      {loggedin && <Redirect to="/" />}
    </Container>
  );
};

export default LoginApp;

import React, { useState } from "react";
import StreamSetupApp from "./StreamSetupApp";
import MonitorApp from "./MonitorApp";
import LoginApp from "./LoginApp";
import SignupApp from "./SignupApp";
import HidStreamApp from "./HidStreamApp";
import PopupApp from "./PopupApp";
import { Link, BrowserRouter as Router, Route } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import { AppBar, Toolbar, Typography, Tabs, Tab } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex"
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

const TopMenus = [
  { path: "/", label: "감시", component: MonitorApp },
  { path: "/config", label: "설정", component: StreamSetupApp },
  { path: "/popup", label: "팝업", component: HidStreamApp },
  { path: "/login", label: "로그인", component: LoginApp },
  { path: "/signup", label: "가입", component: SignupApp }
];

const Header = ({ selected, onTabChange }) => {
  const classes = useStyles();

  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar variant="dense">
        <Typography variant="h6">Web Streaming Service</Typography>
        <Tabs value={selected} onChange={onTabChange}>
          {TopMenus.map(data => (
            <Tab key={data.path} component={Link} to={{ pathname: data.path }} label={data.label} />
          ))}
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

const AppRouters = props => {
  const classes = useStyles();
  const [selected, setSelected] = useState(0);
  const onTabChange = (event, value) => {
    setSelected(value);
  };
  return (
    <Router>
      <Header selected={selected} onTabChange={onTabChange} className={classes.root} />
      {TopMenus.map(data => (
        <Route key={data.path} exact path={data.path} component={data.component} />
      ))}
      <Route path="/view/:hid" component={PopupApp} />
    </Router>
  );
};

export default AppRouters;

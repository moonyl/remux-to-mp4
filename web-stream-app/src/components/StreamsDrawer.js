import React from "react";
// import Fetch from "./libs/Fetch";
import { Drawer, List, ListItem, ListItemText } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

//const drawerWidth = 240;
const useStyles = makeStyles(theme => ({
  drawer: {
    width: theme.drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap"
  },
  drawerList: {
    position: "fixed",
    top: 60
  }
}));

const Loading = () => <p>Loading</p>;

const Error = error => <p>Oops! Something went wrong: {error}</p>;

const StreamList = ({ items, onClick }) => (
  <List>
    {items.map(item => (
      <ListItem button key={item.id} onClick={onClick(item)}>
        <ListItemText primary={item.title} />
      </ListItem>
    ))}
  </List>
);

const StreamsDrawer = ({ onViewStream, loading, error, data }) => {
  const classes = useStyles();
  const listInfos = data.map(item => {
    return { title: item.streamInfo.title, id: item.streamId };
  });
  return (
    <Drawer className={classes.drawer} variant="permanent" open={false}>
      <div className={classes.drawerList}>
        {loading && <Loading />}
        {error && <Error error={error} />}
        {data.length && <StreamList items={listInfos} onClick={onViewStream} />}
      </div>
    </Drawer>
  );
};

export default StreamsDrawer;

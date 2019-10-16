import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearchMinus,
  faSearchPlus,
  faEye,
  faMapMarker,
  faHome
} from "@fortawesome/free-solid-svg-icons";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  ptzButton: {
    fontSize: 14
  }
}));

const VjsControl = ({ control }) => {
  const classes = useStyles();
  return control === "zoomIn" ? (
    <FontAwesomeIcon icon={faSearchMinus} className={classes.ptzButton} />
  ) : control === "zoomOut" ? (
    <FontAwesomeIcon icon={faSearchPlus} className={classes.ptzButton} />
  ) : control === "preset" ? (
    <FontAwesomeIcon icon={faEye} className={classes.ptzButton} />
  ) : control === "setHome" ? (
    <FontAwesomeIcon icon={faMapMarker} className={classes.ptzButton} />
  ) : control === "goHome" ? (
    <FontAwesomeIcon icon={faHome} className={classes.ptzButton} />
  ) : (
    ""
  );
};

export default VjsControl;

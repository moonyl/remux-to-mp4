import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Select, MenuItem, FormControl, InputLabel } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  }
}));

const AudioSelect = ({ select, onSelect, displayInfos }) => {
  const classes = useStyles();
  return (
    <FormControl className={classes.formControl}>
      <InputLabel htmlFor="audio-select">오디오 선택</InputLabel>
      <Select
        value={select}
        onChange={onSelect}
        inputProps={{
          name: "audioSelect",
          id: "audio-select"
        }}
      >
        <MenuItem value={0}>오디오 끄기</MenuItem>
        {displayInfos &&
          displayInfos.map(displayInfo => (
            <MenuItem key={displayInfo.id} value={displayInfo.id}>
              {displayInfo.title}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
};

export default AudioSelect;

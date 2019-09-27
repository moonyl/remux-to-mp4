import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { FormControl, TextField, InputLabel, Select, CircularProgress } from "@material-ui/core";

const useStyles = makeStyles(theme => ({}));

const OnvifOnlyForm = ({ service, profiles, profileSel, profileLoading, error, onValueChange }) => {
  const classes = useStyles();
  return (
    <>
      <TextField
        margin="dense"
        label="Service Addr."
        type="url"
        value={service}
        onChange={onValueChange("service")}
        fullWidth
      />
      {profileLoading ? (
        <CircularProgress className={classes.progress} />
      ) : (
        <FormControl className={classes.formControl} fullWidth error={error ? true : false}>
          <InputLabel htmlFor="profile-native-simple">Profiles</InputLabel>
          <Select
            native
            value={profileSel}
            onChange={onValueChange("profileSel")}
            inputProps={{
              name: "profileSel",
              id: "profile-native-simple"
            }}
          >
            <option value="" disabled={error ? false : true}>
              {error ? error : "Profiles"}
            </option>
            {profiles &&
              profiles.map((item, index) => (
                <option
                  key={index}
                  value={index}
                >{`${item.name} (${item.codec}, ${item.width} x ${item.height})`}</option>
              ))}
          </Select>
        </FormControl>
      )}
    </>
  );
};

export default OnvifOnlyForm;

import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  FormControl,
  TextField,
  InputLabel,
  NativeSelect,
  CircularProgress
} from "@material-ui/core";

const useStyles = makeStyles(theme => ({}));

const OnvifOnlyForm = ({
  service,
  profiles,
  profileSel,
  profileSummary,
  profileLoading,
  error,
  onValueChange
}) => {
  const classes = useStyles();
  //console.log({ profileSel });
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
          <NativeSelect
            value={profileSel}
            onChange={onValueChange("profileSel")}
            inputProps={{
              name: "profileSel",
              id: "profile-native-simple"
            }}
          >
            <option key={-1} value={-1} disabled>
              {error ? error : "Profiles"}
            </option>
            {profiles && profiles.length > 0 ? (
              profiles.map((item, index) => (
                <option key={index} value={index}>
                  {`${item.name} (${item.codec}, ${item.width} x ${item.height})`}
                </option>
              ))
            ) : profileSummary !== "" ? (
              <option value={profileSel}>{profileSummary}</option>
            ) : (
              <></>
            )}
          </NativeSelect>
        </FormControl>
      )}
    </>
  );
};

export default OnvifOnlyForm;

import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  NativeSelect,
  FormHelperText,
  TextField,
  Button
} from "@material-ui/core";

//import DraggableDialog from "./libs/DraggableDialog";
import OnvifOnlyForm from "./OnvifOnlyForm";
import UserInfoForm from "./UserInfoForm";

const useStyles = makeStyles(theme => ({}));

const StreamEditDialog = ({
  type,
  title,
  service,
  profiles,
  profileSel,
  profileLoading,
  url,
  user,
  password,
  error,
  onValueChange,
  open,
  onCancel,
  onSave,
  onAuth
}) => {
  const classes = useStyles();
  const onvifOnlyFormInfo = { service, profiles, profileSel, profileLoading, error, onValueChange };
  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="draggable-dialog-title">
      <DialogTitle id="draggable-dialog-title">스트림 설정</DialogTitle>
      <DialogContent>
        <FormControl className={classes.formControl}>
          <NativeSelect
            className={classes.selectEmpty}
            value={type}
            name="type"
            onChange={onValueChange("type")}
            inputProps={{ "aria-label": "type" }}
          >
            <option value="" disabled>
              타입
            </option>
            <option value={"rtsp"}>RTSP</option>
            <option value={"onvif"}>ONVIF</option>
          </NativeSelect>
          <FormHelperText>타입</FormHelperText>
        </FormControl>
        <TextField
          autoFocus
          margin="dense"
          id="title"
          label="이름"
          type="text"
          value={title}
          onChange={onValueChange("title")}
          fullWidth
        />
        {type === "onvif" ? (
          <OnvifOnlyForm {...onvifOnlyFormInfo} />
        ) : (
          <TextField
            margin="dense"
            label="URL"
            type="url"
            value={url}
            onChange={onValueChange("url")}
            fullWidth
          />
        )}

        <UserInfoForm user={user} password={password} onValueChange={onValueChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          취소
        </Button>
        <Button onClick={onAuth} color="primary">
          인증
        </Button>
        <Button onClick={onSave} color="primary">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StreamEditDialog;

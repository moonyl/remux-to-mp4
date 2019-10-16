import React from "react";
import VideoPlayer, { videojs } from "@moonyl/react-video-js-player";
import withStyles from "@material-ui/core/styles/withStyles";
import ReactDOM from "react-dom";
import VjsControl from "./VjsControl";

const styles = theme => ({
  app: {
    position: "relative",
    top: theme.overrides.heightOffset
  }
});

const vjsComponent = videojs.getComponent("Button");

class vjsControlButton extends vjsComponent {
  constructor(player, options, control) {
    super(player, options);
    this.icon = control.icon;

    this.mount = this.mount.bind(this);

    player.ready(() => {
      this.mount();
    });

    this.on("dispose", () => {
      ReactDOM.unmountComponentAtNode(this.el());
    });

    //console.log("options: ", options);
    //this.addClass(control);
    this.controlText(control.text);
  }

  mount() {
    ReactDOM.render(<VjsControl control={this.icon} vjsComponent={this} />, this.el());
  }
}

class zoomInControlButton extends vjsControlButton {
  constructor(player, options) {
    super(player, options, { icon: "zoomIn", text: "축소" });
  }
}

class zoomOutControlButton extends vjsControlButton {
  constructor(player, options) {
    super(player, options, { icon: "zoomOut", text: "확대" });
  }
}

class presetControlButton extends vjsControlButton {
  constructor(player, options) {
    super(player, options, { icon: "preset", text: "PTZ 프리셋" });
  }
}

class setHomeControlButton extends vjsControlButton {
  constructor(player, options) {
    super(player, options, { icon: "setHome", text: "홈으로 지정" });
  }
}

class goHomeControlButton extends vjsControlButton {
  constructor(player, options) {
    super(player, options, { icon: "goHome", text: "홈으로 이동" });
  }
}

vjsComponent.registerComponent("zoomInControlButton", zoomInControlButton);
vjsComponent.registerComponent("zoomOutControlButton", zoomOutControlButton);
vjsComponent.registerComponent("presetControlButton", presetControlButton);
vjsComponent.registerComponent("setHomeControlButton", setHomeControlButton);
vjsComponent.registerComponent("goHomeControlButton", goHomeControlButton);

class VideoPlayerWithPtz extends React.Component {
  onReady = player => {
    const { controlBar } = player;
    //console.log({ controlBar });
    //console.log({ player });
    //player.getComponent("Button");
    let index = player
      .getChild("controlBar")
      .children()
      .findIndex(component => {
        return component.name_ === "FullscreenToggle";
      });

    const { onZoomIn, onZoomOut, onPreset, onHomeSet, onHome, onReady } = this.props;

    let tempButton = player.getChild("controlBar").addChild("zoomInControlButton", {}, index++);

    tempButton.on("mouseup", onZoomIn("stop"));
    tempButton.on("mousedown", onZoomIn("start"));

    tempButton = player.getChild("controlBar").addChild("zoomOutControlButton", {}, index++);
    tempButton.on("mouseup", onZoomOut("stop"));
    tempButton.on("mousedown", onZoomOut("start"));

    tempButton = player.getChild("controlBar").addChild("presetControlButton", {}, index++);
    tempButton.on("click", onPreset);

    tempButton = player.getChild("controlBar").addChild("setHomeControlButton", {}, index++);
    tempButton.on("click", onHomeSet);

    tempButton = player.getChild("controlBar").addChild("goHomeControlButton", {}, index++);
    tempButton.on("click", onHome);

    //player.getComponent("Button");
    //const { onReady } = this.props;
    onReady(player);
  };

  render() {
    return <VideoPlayer onReady={this.onReady} />;
  }
}

export default withStyles(styles)(VideoPlayerWithPtz);

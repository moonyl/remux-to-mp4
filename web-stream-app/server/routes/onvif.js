const express = require("express");
const router = express.Router();

const net = require("net");
const path = process.platform === "win32" ? "\\\\?\\pipe\\OnvifApp" : "/tmp/OnvifApp";

router.get("/discovery", (req, res) => {
  console.log("discovery received");
  const client = net.createConnection({ path: path }, () => {
    // 'connect' listener
    // const config = { id, ...configValue };
    // console.log("connected to server!");
    const cmd = { cmd: "discovery" };
    client.write(JSON.stringify(cmd));
  });
  client.on("data", data => {
    const reply = JSON.parse(data);
    if (reply.state) {
      console.log("OK");
      //const { result } = reply;
      //console.log(result);
      res.send(data);
    } else {
      console.log("NG");
    }
    client.end();
  });
  client.on("end", () => {
    console.log("disconnected from server");
  });
  client.on("error", error => {
    console.error("should implement handling error", error);
  });
  //res.json({ data: "this is index." });
});

export default router;

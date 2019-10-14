const express = require("express");
const router = express.Router();

const net = require("net");
const path = process.platform === "win32" ? "\\\\?\\pipe\\OnvifApp" : "/tmp/OnvifApp";

const Stream = require("../setup/stream.js");

router.get("/discovery", (req, res) => {
  console.log("discovery received");
  const client = net.createConnection({ path: path }, () => {
    const cmd = { cmd: "discovery" };
    client.write(JSON.stringify(cmd));
  });
  client.on("data", data => {
    const reply = JSON.parse(data);
    if (reply.state) {
      console.log("OK");
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
});

router.post("/auth", (req, res) => {
  const { id, user, password } = req.body;
  //console.log({ id, user, password });
  Stream.findOne({ _id: id }, (error, result) => {
    if (error) {
      console.error(error);
      res.send({ state: "NG", error });
      return;
    }
    //console.log({ result });
    const { service } = result;
    const client = net.createConnection({ path: path }, () => {
      const cmd = { cmd: "auth", param: { xaddr: service, user, password } };
      console.log({ cmd });
      client.write(JSON.stringify(cmd));
    });
    client.on("data", data => {
      const reply = JSON.parse(data);
      if (reply.state) {
        console.log("OK");
        res.send(data);
      } else {
        //console.log({ reply });
        //console.log("NG");
        res.send(data);
      }
      client.end();
    });
    client.on("end", () => {
      console.log("disconnected from server");
    });
    client.on("error", error => {
      console.error("should implement handling error", error);
    });
  });
});

export default router;

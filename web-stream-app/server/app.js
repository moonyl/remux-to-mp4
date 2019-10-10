const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const api = require("./routes/index");
import auth from "./routes/auth";
import passport from "passport";
import onvif from "./routes/onvif";
require("dotenv").config();

app.use(bodyParser.json());
app.use("/api", api);
app.use(passport.initialize());
app.use("/auth", auth);
app.use("/onvif", onvif);
app.use("/publish", express.static(__dirname + "/publish/"));

const port = process.env.SERVER_PORT || 3003;
app.listen(port, () => console.log(`Listening on port ${port}...`));

const net = require("net");
const path = process.platform === "win32" ? "\\\\?\\pipe\\WebStreamApp" : "/tmp/WebStreamApp";

const server = net.createServer();
server.listen(path, () => {
  console.log("with stream server");
});

const StreamServerHandlers = require("./ipc/streamServer");
server.on("connection", StreamServerHandlers.handleStreamRequest);

const LinvoDB = require("linvodb3");
if (process.env.APPDATA) {
  LinvoDB.dbPath = process.env.APPDATA + "/web-stream-server";
} else if (process.platform === "linux") {
  LinvoDB.dbPath = process.env.HOME + "/.local/share/web-stream-server";
}

const Stream = new LinvoDB("Stream", {
  //id: String,
  title: String,
  type: String,
  user: String,
  password: String,
  url: String,
  service: String,
  profiles: [{ codec: String, name: String, width: Number, height: Number, url: String }],
  profileSel: Number
});

module.exports = Stream;

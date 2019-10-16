const LinvoDB = require("linvodb3");
if (process.env.APPDATA) {
  LinvoDB.dbPath = process.env.APPDATA + "/web-stream-server";
} else if (process.platform === "linux") {
  LinvoDB.dbPath = process.env.HOME + "/.local/share/web-stream-server";
}

const Stream = new LinvoDB("Stream", {
  title: String,
  type: String,
  user: String,
  password: String,
  url: String,
  service: String,
  profileSummary: String,
  profileSel: Number,
  hid: { type: String, unique: true },
  ptz: Boolean
});

module.exports = Stream;

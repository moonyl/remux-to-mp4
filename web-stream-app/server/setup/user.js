const LinvoDB = require("linvodb3");
if (process.env.APPDATA) {
  LinvoDB.dbPath = process.env.APPDATA + "/web-stream-server";
} else if (process.platform === "linux") {
  LinvoDB.dbPath = process.env.HOME + "/.local/share/web-stream-server";
}

const User = new LinvoDB("User", {
  email: {
    type: String,
    index: { unique: true }
  },
  password: String,
  firstName: String,
  lastName: String
});

module.exports = User;

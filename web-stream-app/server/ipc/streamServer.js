const Stream = require("../setup/stream");

const StreamServerHandlers = {
  handleStreamRequest: socket => {
    //console.log(socket);
    console.log("request somewhere");
    socket.on("data", data => {
      const request = JSON.parse(data);
      //console.log({ request });
      const { cmd, param, sid } = request;
      if (cmd === "stream") {
        const { id: _id } = param;
        console.log({ param });
        Stream.findOne({ _id }, (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log({ data });
          const { url, user, password } = data;
          socket.write(
            JSON.stringify({ sid, state: "OK", result: { url, user, password } }),
            err => {
              if (err) {
                console.error(err);
                return;
              }
              console.log("replied");
            }
          );
        });
      }
    });
  }
};

module.exports = StreamServerHandlers;

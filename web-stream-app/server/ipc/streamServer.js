const Stream = require("../setup/stream");

const StreamServerHandlers = {
  handleStreamRequest: socket => {
    //console.log(socket);
    console.log("request somewhere");
    socket.on("data", data => {
      const request = JSON.parse(data);
      //console.log({ request });
      const { cmd, param } = request;
      if (cmd === "stream") {
        const { id } = param;
        console.log({ param });
        Stream.findOne({ id }, (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log({ data });
          const { url } = data;
          socket.write(JSON.stringify({ state: "OK", result: { url } }), err => {
            if (err) {
              console.error(err);
              return;
            }
            console.log("replied");
          });
        });
      }
    });
  }
};

module.exports = StreamServerHandlers;

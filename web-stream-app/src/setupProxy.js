const proxy = require("http-proxy-middleware");

module.exports = function(app) {
  app.use(
    proxy("/api", {
      target: "http://localhost:3000/"
    })
  );
  // app.use(
  //   proxy("/publish", {
  //     target: "http://localhost:3000/"
  //   })
  // );
  app.use(
    proxy("/auth", {
      target: "http://localhost:3000/"
    })
  );
  app.use(
    proxy("/onvif", {
      target: "http://localhost:3000/"
    })
  );
};

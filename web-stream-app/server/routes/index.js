const express = require("express");
const router = express.Router();
const Stream = require("../setup/stream.js");

router.get("/", (req, res) => {
  res.json({ data: "this is index." });
});

router.get("/save", (req, res) => {
  let streamData = new Stream();
  streamData.id = "80f148c8-a487-429e-82a4-e36528fea7d5";
  streamData.title = "Test Title";
  streamData.type = "rtsp";
  streamData.url = "rtsp://192.168.15.11/Apink_I'mSoSick_720_2000kbps.mp4";
  streamData.save(() => {
    Stream.find({ id: "80f148c8-a487-429e-82a4-e36528fea7d5" }, (err, res) => {
      if (err) {
        console.log("find error");
        return;
      }
      console.log("What?");
      console.log(res);
    });
  });
});

router.get("/update", (req, res) => {
  const newData = {
    title: "Test Title",
    type: "onvif",
    url: "rtsp://192.168.15.11/Apink_I'mSoSick_720_2000kbps.mp4"
  };
  Stream.update(
    { id: "80f148c8-a487-429e-82a4-e36528fea7d5" },
    {
      $set: newData
    },
    {},
    (err, numReplaced) => {
      if (err) {
        console.error("err: ", err);
        return;
      }
      console.log("updated");
    }
  );
});

router.get("/find", (req, res) => {
  Stream.find({ id: "80f148c8-a487-429e-82a4-e36528fea7d5" }, (err, res) => {
    if (err) {
      console.log("find error");
      return;
    }
    console.log("What?");
    console.log(res);
  });
});

router.get("/remove", (req, res) => {
  Stream.findOne({ id: "80f148c8-a487-429e-82a4-e36528fea7d5" }, (err, doc) => {
    doc.remove(() => {
      console.log("removed");
    });
  });
});

module.exports = router;

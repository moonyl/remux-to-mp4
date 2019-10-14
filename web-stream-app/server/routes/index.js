const express = require("express");
const router = express.Router();
const Stream = require("../setup/stream.js");
const uuid = require("uuid/v4");
const uuidv5 = require("uuid/v5");

router.get("/", (req, res) => {
  res.json({ data: "this is index." });
});

router.get("/stream/:id", (req, res) => {
  const { id } = req.params;
  Stream.findOne({ _id: id }, (error, result) => {
    if (error) {
      console.error(error);
      res.send({ state: "NG", error });
      return;
    }
    console.log({ result });
    const { _id, title, type, url, user, password, service, profiles, profileSel } = result;
    res.send({
      state: "OK",
      result: {
        streamId: _id,
        streamInfo: { title, type, url, user, password, service, profiles, profileSel }
      }
    });
  });
});

router.post("/stream/:id", (req, res) => {
  const { id } = req.params;
  const { cmd, param } = req.body;
  //console.log({ id, cmd });

  Stream.findOne({ _id: id }, (error, doc) => {
    if (error) {
      console.error(error);
      res.send({ state: "NG", error });
    }
    if (doc) {
      if (cmd === "delete") {
        doc.remove(() => {
          console.log("removed");
          res.send({ state: "OK" });
        });
      } else if (cmd === "update") {
        //console.log("should update record, result: ");
        //console.log({ param });
        //console.log({ doc });
        for (const key in param) {
          console.log({ key });
          doc[key] = param[key];
        }
        doc.save(err => {
          if (err) {
            console.error(err);
            return;
          }
          console.log("saved: ", doc._id);
        });
      }
    }
  });
});

router.get("/stream", (req, res) => {
  Stream.find({}, (error, result) => {
    if (error) {
      console.error(error);
      res.send({ state: "NG", error });
      return;
    }
    const streams = result.map(item => {
      const { _id, title, type, url, user, password, service, profileSummary, profileSel } = item;
      //console.log(_id, title);
      return {
        streamId: _id,
        streamInfo: { title, type, url, user, password, service, profileSummary, profileSel }
      };
    });
    res.send({ state: "OK", result: streams });
    //console.log({ result });
  });
});

router.post("/stream", (req, res) => {
  console.log("body: ", req.body);
  const { streamId, streamInfo } = req.body;
  let _id = streamId;
  if (!streamId) {
    console.log("new case");
    const { type, service } = streamInfo;
    if (type === "onvif") {
      _id = uuidv5(service, uuidv5.URL);
    } else {
      _id = uuid();
    }
    //_id = "e3f3408d-6f8b-430c-926b-3e7e8a5f2aec";
  }
  Stream.find({ _id }, (error, result) => {
    if (error) {
      console.error(error);
      res.send({ state: "NG", error });
      return;
    }
    console.log({ result, _id });
    if (result.length === 0) {
      console.log("should add new record");
      let streamData = new Stream();
      streamData._id = _id;
      for (const key in streamInfo) {
        console.log({ key });
        streamData[key] = streamInfo[key];
      }

      streamData.save(error => {
        if (error) {
          res.send({ state: "NG", error });
          return;
        }
        res.send({ state: "OK" });
      });
      return;
    }
    console.log("should update record, result: ", result);
    Stream.update({ _id }, { $set: streamInfo }, {}, (error, numReplaced) => {
      if (error) {
        res.send({ state: "NG", error });
        return;
      }
      console.log("updated");
      res.send({ state: "OK" });
    });
  });
});

router.post("/setupStream", (req, res) => {
  console.log("body: ", req.body);
  const { streamId, streamInfo } = req.body;
  let _id = streamId;
  if (!streamId) {
    console.log("new case");
    _id = uuid();
    //_id = "e3f3408d-6f8b-430c-926b-3e7e8a5f2aec";
  }
  Stream.find({ _id }, (error, result) => {
    if (error) {
      console.error(error);
      res.send({ state: "NG", error });
      return;
    }
    console.log({ result, _id });
    if (result.length === 0) {
      console.log("should add new record");
      let streamData = new Stream();
      streamData._id = _id;
      const { title, type, url, user, password, service, profiles, profileSel } = streamInfo;
      streamData.title = title;
      streamData.type = type;
      streamData.url = url;
      streamData.user = user;
      streamData.service = service;
      streamData.password = password;
      streamData.profiles = profiles;
      streamData.profileSel = profileSel;
      streamData.save(error => {
        if (error) {
          res.send({ state: "NG", error });
          return;
        }
        res.send({ state: "OK" });
      });
      return;
    }
    console.log("should update record, result: ", result);
    Stream.update({ _id }, { $set: streamInfo }, {}, (error, numReplaced) => {
      if (error) {
        res.send({ state: "NG", error });
        return;
      }
      console.log("updated");
      res.send({ state: "OK" });
    });
  });
});

router.get("/save", (req, res) => {
  let streamData = new Stream();
  streamData.id = "80f148c8-a487-429e-82a4-e36528fea7d5";
  streamData.title = "I'm so sick";
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

  streamData = new Stream();
  streamData.id = "90f148c8-a487-429e-82a4-e36528fea7d5";
  streamData.title = "My Camera";
  streamData.type = "rtsp";
  streamData.url = "rtsp://192.168.15.109:554/profile3/media.smp";
  streamData.user = "admin";
  streamData.password = "q1w2e3r4@";
  streamData.save(() => {
    Stream.find({ id: "90f148c8-a487-429e-82a4-e36528fea7d5" }, (err, res) => {
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
    console.log({ err });
    if (doc) {
      doc.remove(() => {
        console.log("removed");
      });
    }
  });
  Stream.findOne({ id: "90f148c8-a487-429e-82a4-e36528fea7d5" }, (err, doc) => {
    if (doc) {
      doc.remove(() => {
        console.log("removed");
      });
    }
  });
});

module.exports = router;

const { db } = require("../util/admin");
const e = require("express");

exports.getAllShouts = (req, res) => {
  db.collection("shout")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let shouts = [];
      data.forEach((doc) => {
        shouts.push({
          shoutId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage,
        });
      });
      return res.json(shouts);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postOneShout = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "Body must not be empty" });
  }

  const newShout = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  db.collection("shout")
    .add(newShout)
    .then((doc) => {
      const resShout = newShout;
      resShout.shoutId = doc.id;
      res.json(resShout);
    })
    .catch((err) => {
      res.status(500).json({ error: `Something went wrong` });
      console.error(err);
    });
};

// Fetch one shout
exports.getShout = (req, res) => {
  let shoutData = {};
  db.doc(`/shout/${req.params.shoutId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Shout not found" });
      }
      shoutData = doc.data();
      shoutData.shoutId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("shoutId", "==", req.params.shoutId)
        .get();
    })
    .then((data) => {
      shoutData.comments = [];
      data.forEach((doc) => {
        shoutData.comments.push(doc.data());
      });
      return res.json(shoutData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Comment on a comment
exports.commentOnShout = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    shoutId: req.params.shoutId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  db.doc(`/shout/${req.params.shoutId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Shout not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};

// Like a shout
exports.likeShout = (req, res) => {
  // Check if shout exists and if the user already liked the shout, which means
  // if there is already a like document in the db

  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("shoutId", "==", req.params.shoutId)
    .limit(1);

  const shoutDocument = db.doc(`/shout/${req.params.shoutId}`);

  let shoutData;

  shoutDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        shoutData = doc.data();
        shoutData.shoutId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Shout not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            shoutId: req.params.shoutId,
            userHandle: req.user.handle,
          })
          .then(() => {
            shoutData.likeCount++;
            return shoutDocument.update({ likeCount: shoutData.likeCount });
          })
          .then(() => {
            return res.json(shoutData);
          });
      } else {
        return res.status(400).json({ error: "Shout already liked" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unlikeShout = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("shoutId", "==", req.params.shoutId)
    .limit(1);

  const shoutDocument = db.doc(`/shout/${req.params.shoutId}`);

  let shoutData;

  shoutDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        shoutData = doc.data();
        shoutData.shoutId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Shout not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Shout not liked" });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            shoutData.likeCount--;
            return shoutDocument.update({ likeCount: shoutData.likeCount });
          })
          .then(() => {
            res.json(shoutData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Delete a shout
exports.deleteShout = (req, res) => {
  const document = db.doc(`/shout/${req.params.shoutId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Shout not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Shout deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

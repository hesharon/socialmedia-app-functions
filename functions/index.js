const functions = require("firebase-functions");

const app = require("express")();

const FbAuth = require("./util/FbAuth");

const { db } = require("./util/admin");

const cors = require("cors");
app.use(cors({ origin: true }));

const {
  getAllShouts,
  postOneShout,
  getShout,
  commentOnShout,
  likeShout,
  unlikeShout,
  deleteShout,
} = require("./handlers/shouts");

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");

// Shout route
app.get("/shouts", getAllShouts);
app.post("/shout", FbAuth, postOneShout);
app.get("/shout/:shoutId", getShout);
app.post("/shout/:shoutId/comment", FbAuth, commentOnShout);
app.get("/shout/:shoutId/like", FbAuth, likeShout);
app.get("/shout/:shoutId/unlike", FbAuth, unlikeShout);
app.delete("/shout/:shoutId/", FbAuth, deleteShout);

// users route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FbAuth, uploadImage);
app.post("/user", FbAuth, addUserDetails);
app.get("/user", FbAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FbAuth, markNotificationsRead);

exports.api = functions.region("northamerica-northeast1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("northamerica-northeast1")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/shout/${snapshot.data().shoutId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            shoutId: doc.id,
          });
        } else {
          console.log("Help");
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnlike = functions
  .region("northamerica-northeast1")
  .firestore.document("likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("northamerica-northeast1")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/shout/${snapshot.data().shoutId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            shoutId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("northamerica-northeast1")
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    // Change only when image is changed because we don't want to run this
    // if they change the captions or anything
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection("shout")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const shout = db.doc(`/shout/${doc.id}`);
            batch.update(shout, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onShoutDelete = functions
  .region("northamerica-northeast1")
  .firestore.document("/shout/{shoutId}")
  .onDelete((snapshot, context) => {
    // context has the parameters that we have in the URL
    const shoutId = context.params.shoutId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("shoutId", "==", shoutId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection("likes").where("shoutId", "==", shoutId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("shoutId", "==", shoutId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });

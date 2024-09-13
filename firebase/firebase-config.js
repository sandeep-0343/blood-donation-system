const admin = require('firebase-admin');
const serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<sai-chat-bot>.firebaseio.com"
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };

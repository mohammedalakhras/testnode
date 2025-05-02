
var admin = require("firebase-admin");

var serviceAccount = require("./chat-97789-firebase-adminsdk-fbsvc-97d9e1c06a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const messaging = admin.messaging();

module.exports = { messaging };

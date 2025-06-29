const { messaging } = require("../config/firebase/firebaseAdmin.js");

/**
 * sendNotification
 * @param {string[]} tokens - Array pf FCM tokens
 * @param {{ title: string, body: string, data?: Object }} payload - title and Message body
 * @returns {Promise<Object>} - Result of sending to FCMs
 */
async function sendNotification(tokens, payload) {
  try {
    if (Array.isArray(tokens) && tokens.length !== 0) {
      const message = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: { priority: "high" },
        apns: { headers: { "apns-priority": "10" } },
      };

      const response = await messaging.sendEachForMulticast(message);
      return response;
    } else {
      console.log("No Tokens Passed:", tokens);
    }
    // بناء رسالة متعددة الأجهزة
  } catch (error) {
    console.log("Send Notification Error:", error);
  }
}

module.exports = { sendNotification };

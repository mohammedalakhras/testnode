

const { messaging } = require('../config/firebase/firebaseAdmin.js');

/**
 * sendNotification
 * @param {string[]} tokens - Array pf FCM tokens 
 * @param {{ title: string, body: string, data?: Object }} payload - title and Message body
 * @returns {Promise<Object>} - Result of sending to FCMs
 */
async function sendNotification(tokens, payload) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new Error('FCM tokens array must be non-empty');
  }

  // بناء رسالة متعددة الأجهزة
  const message = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data || {},
    android: { priority: 'high' },
    apns: { headers: { 'apns-priority': '10' } },
  };

 
  const response = await messaging.sendEachForMulticast(message);
  return response;
}

module.exports = { sendNotification };

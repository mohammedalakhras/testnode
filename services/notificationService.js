const NotificationModel = require("../models/Notification.js");
const { sendNotification } = require("../src/lib/notificationService.js");
const { UserModel } = require("../models/User.js");

/**
 * createAndSendNotification
 * @param {ObjectId[]} userIds   - array of recipient user IDs
 * @param {{ title: string, body: string, data?: Object }} payload
 */
async function createAndSendNotification(userIds, payload) {
  const docs = userIds.map((uid) => ({
    user: uid,
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  }));
  await NotificationModel.insertMany(docs);

  //  جلب توكنات ال
  //  FCM
  //  لكل مستخدم
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("fcmTokens")
    .lean();
console.log("users",users);

  const allTokens = users.flatMap((u) => u.fcmTokens || []);

  if (allTokens.length) {
   const res= await sendNotification(allTokens, payload);
   console.log(res);
   
  }
}

module.exports = { createAndSendNotification };

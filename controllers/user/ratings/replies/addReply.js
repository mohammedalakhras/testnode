const { RatingModel } = require("../../../../models/Rating.js");
const mongoose = require("mongoose");
const { createAndSendNotification } = require("../../../../services/notificationService.js");
const { UserModel } = require("../../../../models/User.js");

async function addReply(req, res) {
  const { ratingId } = req.params;
  const { text } = req.body;
  const authorId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(ratingId)) {
    return res.status(400).json({ msg: "معرّف التقييم غير صالح." });
  }

  if (typeof text !== "string" || text.trim().length < 1) {
    return res.status(400).json({ msg: "نص الرد مطلوب." });
  }

  const rating = await RatingModel.findById(ratingId);
  if (!rating) {
    return res.status(404).json({ msg: "التقييم غير موجود." });
  }

  try {
    rating.replies.push({ author: authorId, text: text.trim() });
    await rating.save();

    const newReply = rating.replies[rating.replies.length - 1];

    


//Send Notification
 // جلب معلومات المستخدم الذي أضاف الرد
 const replyAuthor = await UserModel.findById(authorId, "username");
    
 // إعداد الإشعارات
 const notifications = [];
 
 //  إشعار لصاحب التقييم
 if (rating.author.toString() !== authorId) {
   notifications.push({
     userId: rating.author,
     title: "تمت إضافة رد على تقييمك",
     body: `قام ${replyAuthor.username} بالرد على تقييمك`,
     data: {
       ratingId: rating._id,
       type: "reply_to_your_rating"
     }
   });
 }
 
 // إشعار للمستخدم الذي تلقى التقييم 
 if (rating.targetUser.toString() !== authorId) {
   notifications.push({
     userId: rating.targetUser._id,
     title: "تمت إضافة رد على تقييم في صفحتك",
     body: `قام ${replyAuthor.username} بالرد على تقييم في صفحتك الشخصية`,
     data: {
       ratingId: rating._id,
       type: "reply_to_rating_on_your_profile"
     }
   });
 }
 
 for (const notification of notifications) {
   try {
     await createAndSendNotification([notification.userId], {
       title: notification.title,
       body: notification.body,
       data: notification.data
     });
   } catch (notifError) {
     console.error(`Failed to send notification to ${notification.userId}:`, notifError);
   }
 }
    return res
      .status(201)
      .json({ msg: "تم إضافة الرد بنجاح.", reply: newReply });
  } catch (err) {
    console.error("Error adding reply:", err);
    return res.status(500).json({ msg: "فشل إضافة الرد. حاول مرة أخرى." });
  }
}

module.exports = { addReply };

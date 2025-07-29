const mongoose = require("mongoose");
const { CommentModel } = require("../../models/Comment.js");

const { sendNotification } = require("../../src/lib/notificationService.js"); // مسار دالتك للإشعارات
const {
  createAndSendNotification,
} = require("../../services/notificationService.js");

/**
 *
 * add reply to comment.
 * send notification to [productOwner, CommnetOwner] unless the reply owner one of them.
 * don't send notification to the reply owner.
 *
 */

async function addReplyToComment(req, res) {
  try {
    const userId = req.user.id;
    const { commentId, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ msg: "رقم التعليق غير صالح" });
    }
    const comment = await CommentModel.findById(commentId)
      .populate("user", "_id fcmTokens username") // صاحب التعليق الأصلي
      .populate({
        path: "product",
        select: "owner",
        populate: { path: "owner", select: "_id fcmTokens username" },
      });

    if (!comment)
      return res.status(404).json({ message: "التعليق غير موجود." });

    const productOwner = comment.product.owner;
    const commentOwner = comment.user;

    comment.replies.push({
      content,
      user: new mongoose.Types.ObjectId(userId),
      createdAt: Date.now(),
    });
    await comment.save();

    // const tokensToNotify = new Set();
    const userIDs = new Set();

    if (productOwner._id.toString() !== userId.toString()) {
      // (productOwner.fcmTokens || []).forEach((t) => tokensToNotify.add(t));
      userIDs.add(productOwner._id.toString());
    }
    if (commentOwner._id.toString() !== userId.toString()) {
      // (commentOwner.fcmTokens || []).forEach((t) => tokensToNotify.add(t));
      userIDs.add(commentOwner._id.toString());
    }

    // if (tokensToNotify.size > 0) {
    const payload = {
      title: "تم الرد على تعليق",
      body: ` قام ${req.user.username} بالرد على تعليق \n "${content.slice(
        0,
        25
      )}..."`,
      data: { commentId: commentId.toString(), type: "new_reply" },
    };
    // await sendNotification(Array.from(tokensToNotify), payload);
    
    await createAndSendNotification([...userIDs], payload);

    // }

    return res.status(201).json({ message: "تم إضافة الرد بنجاح." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حدث خطأ في السيرفر." });
  }
}

module.exports = addReplyToComment;

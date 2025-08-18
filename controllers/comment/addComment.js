const mongoose = require("mongoose");
const { CommentModel } = require("../../models/Comment.js");
const { ProductModel } = require("../../models/Product.js");
const { UserModel } = require("../../models/User.js");
const { sendNotification } = require("../../src/lib/notificationService.js");
const {
  createAndSendNotification,
} = require("../../services/notificationService.js");
const {
  replaceUserKeysWithUrls,
} = require("../../services/replaceUsersKeysWithUrls.js");

async function addComment(req, res) {
  try {
    const userId = req.user.id;
    const { productId, content, private = false } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ msg: "رقم المنتج غير صالح" });
    }

    const product = await ProductModel.findById(productId).populate(
      "owner",
      "_id fcmTokens username"
    );

    if (!product) return res.status(404).json({ msg: "المنتج غير موجود." });

    const comment = new CommentModel({
      content,
      private: private,
      user: new mongoose.Types.ObjectId(userId),
      product: new mongoose.Types.ObjectId(productId),

      replies: [],
    });
    await comment.save();
    let data;
    //Send Notification
    const productOwnerId = product.owner._id.toString();
    if (productOwnerId !== userId.toString()) {
      const userData = await UserModel.findById(req.user.id)
        .select("username photo fullname")
        .lean();
      if (userData.photo)
        userData.photo = await replaceUserKeysWithUrls(userData.photo);
      data = userData;
      // const tokens = product.owner.fcmTokens || [];
      // if (Array.isArray(tokens) && tokens.length > 0) {
      const payload = {
        title: "تم إضافة تعليق جديد",
        body: `علّق ${userData.username}  على منتجك: "${content.slice(
          0,
          30
        )}..."`,
        data: { productId: productId.toString(), type: "new_comment" },
      };
      // await sendNotification(tokens, payload);
      await createAndSendNotification([productOwnerId], payload);
      // }
    }

    return res
      .status(201)
      .json({ msg: "تم نشر التعليق بنجاح.", commentId: comment._id, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "حدث خطأ في السيرفر." });
  }
}

module.exports = addComment;

const { validateAddRating, RatingModel } = require("../../../models/Rating.js");
const { UserModel } = require("../../../models/User.js");
const mongoose = require("mongoose");
const {
  createAndSendNotification,
} = require("../../../services/notificationService.js");

async function addRating(req, res) {
  const { userId } = req.params;
  const { type, stars, text } = req.body;
  const authorId = req.user.id;
  if (!authorId) {
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: "معرف المستخدم غير صالح." });
  }

  if (userId === authorId)
    return res.status(400).json({ msg: "لا يمكنك تقييم نفسك." });

  const { error } = validateAddRating({
    ...req.body,
    targetUser: userId,
    author: authorId,
  });
  if (error) return res.status(400).json({ msg: error.details[0].message });

  const exists = await RatingModel.findOne({
    targetUser: userId,
    author: authorId,
  });
  if (exists)
    return res.status(400).json({ msg: "لقد قيمت هذا المستخدم مسبقًا." });

  if (type === "positive" && (stars == null || stars < 1 || stars > 5)) {
    return res.status(400).json({ msg: "نجوم الإيجابي يجب أن تكون بين 1 و5." });
  }
  if (type === "negative" && stars != null) {
    return res
      .status(400)
      .json({ msg: "التقييم السلبي لا يمكن أن يحتوي نجوم." });
  }

  const User = await UserModel.findById(userId);
  if (!User) {
    return res.status(404).json({ msg: "المستخدم غير موجود" });
  }

  try {
    const rating = new RatingModel({
      targetUser: new mongoose.Types.ObjectId(userId),
      author: new mongoose.Types.ObjectId(authorId),
      type,
      stars,
      text,
    });

    await rating.save();
    const inc = {};
    if (type === "positive") {
      inc["rate.positiveCount"] = 1;
      inc["rate.starsSum"] = stars;
    } else {
      inc["rate.negativeCount"] = 1;
    }
    await UserModel.findByIdAndUpdate(
      userId,
      { $inc: inc },
      { runValidators: true }
    );

    try {
      const notificationType =
        type === "positive" ? "تقييم إيجابي" : "تقييم سلبي";

      const notificationTitle = `لقد تلقيت ${notificationType}`;

      const notificationBody =
        type === "positive"
          ? `قام ${authorUser.username} بتقييمك بـ ${stars} نجوم${
              text ? " مع تعليق" : ""
            }`
          : `قام ${authorUser.username} بتقييمك سلبيًا${
              text ? " مع تعليق" : ""
            }`;

      const payload = {
        title: notificationTitle,
        body: notificationBody,
        data: {
          ratingId: rating._id,
          type: "new_rating",
          ratingType: type,
        },
      };

      await createAndSendNotification([userId], payload);
    } catch (notifError) {
      console.error("Failed to send rating notification:", notifError);
    }
    res.status(201).json({ msg: "تمت إضافة التقييم بنجاح", rating: rating });
  } catch (err) {
    try {
      await RatingModel.find({
        targetUser: userId,
        author: authorId,
      }).deleteOne();
    } catch (delErr) {
      console.log("فشل إضافة التقييم.\n" + delErr);
    }

    if (err.code === 11000) {
      return res.status(400).json({ msg: "لقد قيمت هذا المستخدم مسبقًا." });
    }
    res.status(500).json({ msg: "خطأ في السيرفر فشل إضافة التقييم." });
  }
}

module.exports = { addRating };

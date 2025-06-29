const {
  RatingModel,
  validateEditRating,
} = require("../../../models/Rating.js");
const { UserModel } = require("../../../models/User.js");
const mongoose = require("mongoose");

async function editRating(req, res) {
  try {
    const { ratingId } = req.params;
    const { stars, text } = req.body;
    const userId = req.user.id;

    const { error } = validateEditRating(req.body);

    if (error) {
      return res.status(400).json({ msg: error.message });
    }

    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return res.status(400).json({ msg: "معرف التقييم غير صالح." });
    }

    const rating = await RatingModel.findById(ratingId);
    if (!rating) {
      return res.status(404).json({ msg: "التقييم غير موجود." });
    }

    if (rating.author.toString() !== userId) {
      return res.status(403).json({ msg: "لا تملك صلاحية تعديل هذا التقييم." });
    }

    if (rating.type === "negative" && stars != null) {
      return res
        .status(400)
        .json({ msg: "التقييم السلبي لا يمكن أن يحتوي على نجوم." });
    }
    if (rating.type === "positive") {
      if (stars == null || stars < 1 || stars > 5) {
        return res
          .status(400)
          .json({ msg: "نجوم التقييم الإيجابي يجب أن تكون بين 1 و5." });
      }
    }

    const oldStars = rating.stars;
    const oldText = rating.text;

    rating.text = text;
    if (rating.type === "positive") {
      rating.stars = stars;
    }

    try {
      await rating.save();

      const userInc = {};
      if (rating.type === "positive") {
        userInc["rate.starsSum"] = stars - oldStars;
      }

      if (Object.keys(userInc).length) {
        await UserModel.findByIdAndUpdate(
          rating.targetUser,
          { $inc: userInc },
          { runValidators: true }
        );
      }

      return res.json({ msg: "تم تعديل التقييم بنجاح.", rating });
    } catch (err) {
      console.error("Error editing rating:", err);

      try {
        rating.stars = oldStars;
        rating.text = oldText;
        await rating.save();
      } catch (rollErr) {
        console.error("Rollback failed:", rollErr);
      }

      return res
        .status(500)
        .json({ msg: "فشل تعديل التقييم. خطأ في السيرفر \n حاول مرة أخرى." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "فشل تعديل التقييم. خطأ في السيرفر \n حاول مرة أخرى." });
  }
}

module.exports = { editRating };

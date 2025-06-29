const { RatingModel } = require("../../../models/Rating.js");
const { UserModel } = require("../../../models/User.js");
const mongoose = require("mongoose");

async function deleteRating(req, res) {
  const { ratingId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";


  if (!mongoose.Types.ObjectId.isValid(ratingId)) {
    return res.status(400).json({ msg: "معرف التقييم غير صالح." });
  }

  const rating = await RatingModel.findById(ratingId);
  if (!rating) {
    return res.status(404).json({ msg: "التقييم غير موجود." });
  }


  if (!isAdmin && rating.author.toString() !== userId) {
    return res.status(403).json({ msg: "لا تملك صلاحية حذف هذا التقييم." });
  }

  //  Save Rate to rollback if error exists
  const { type, stars = 0, targetUser } = rating;


  const dec = {};
  if (type === "positive") {
    dec["rate.positiveCount"] = -1;
    dec["rate.starsSum"] = -stars;
  } else {
    dec["rate.negativeCount"] = -1;
  }

  try {
    await UserModel.findByIdAndUpdate(
      targetUser,
      { $inc: dec },
      { runValidators: true }
    );

    await rating.deleteOne();

    return res.json({ msg: "تم حذف التقييم بنجاح." });
  } catch (err) {
    console.error("Error deleting rating:", err);

    try {
      const rollbackInc = {};
      for (const key in dec) {
        rollbackInc[key] = -dec[key];
      }
      await UserModel.findByIdAndUpdate(
        targetUser,
        { $inc: rollbackInc },
        { runValidators: true }
      );
    } catch (rollErr) {
      console.error("Rollback failed after delete error:", rollErr);
    }

    return res.status(500).json({ msg: "فشل حذف التقييم. حاول مرة أخرى." });
  }
}

module.exports = { deleteRating };

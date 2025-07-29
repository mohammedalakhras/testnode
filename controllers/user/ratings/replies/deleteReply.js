// controllers/user/ratings/replies/deleteReply.js

const { RatingModel } = require("../../../../models/Rating.js");

const mongoose = require("mongoose");

async function deleteReply(req, res) {
  const { ratingId, replyId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";

  if (
    !mongoose.Types.ObjectId.isValid(ratingId) ||
    !mongoose.Types.ObjectId.isValid(replyId)
  ) {
    return res.status(400).json({ msg: "معرّف غير صالح." });
  }

  const rating = await RatingModel.findById(ratingId);
  if (!rating) {
    return res.status(404).json({ msg: "التقييم غير موجود." });
  }

  const reply = rating.replies.id(replyId);
  if (!reply) {
    return res.status(404).json({ msg: "الرد غير موجود." });
  }

  if (!isAdmin && reply.author.toString() !== userId) {
    return res.status(403).json({ msg: "لا تملك صلاحية حذف هذا الرد." });
  }

  try {
    rating.replies.pull(replyId);
    await rating.save();
    return res.json({ msg: "تم حذف الرد بنجاح." });
  } catch (err) {
    console.error("Error deleting reply:", err);
    return res.status(500).json({ msg: "فشل حذف الرد. حاول مرة أخرى." });
  }
}

module.exports = { deleteReply };

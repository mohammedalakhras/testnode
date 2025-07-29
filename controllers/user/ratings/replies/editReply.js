// controllers/user/ratings/replies/editReply.js

const { RatingModel } = require("../../../../models/Rating.js");
const mongoose = require("mongoose");

async function editReply(req, res) {
  const { ratingId, replyId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (
    !mongoose.Types.ObjectId.isValid(ratingId) ||
    !mongoose.Types.ObjectId.isValid(replyId)
  ) {
    return res.status(400).json({ msg: "معرّف غير صالح." });
  }
  if (typeof text !== "string" || text.trim().length < 1) {
    return res.status(400).json({ msg: "نص الرد مطلوب." });
  }

  const rating = await RatingModel.findById(ratingId);
  if (!rating) {
    return res.status(404).json({ msg: "التقييم غير موجود." });
  }

  const reply = rating.replies.id(replyId);
  if (!reply) {
    return res.status(404).json({ msg: "الرد غير موجود." });
  }

  // فقط صاحب الرد يمكنه التعديل
  if (reply.author.toString() !== userId) {
    return res.status(403).json({ msg: "لا تملك صلاحية تعديل هذا الرد." });
  }

  try {
    reply.text = text.trim();

    reply.createdAt = reply.createdAt; // optional keep original date
    await rating.save();
    return res.json({ msg: "تم تعديل الرد بنجاح.", reply });
  } catch (err) {
    console.error("Error editing reply:", err);
    return res.status(500).json({ msg: "فشل تعديل الرد. حاول مرة أخرى." });
  }
}

module.exports = { editReply };

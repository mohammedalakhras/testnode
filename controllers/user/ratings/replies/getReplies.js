// controllers/user/ratings/replies/getReplies.js

const { RatingModel } = require("../../../../models/Rating.js");
const mongoose = require("mongoose");

async function getReplies(req, res) {
  const { ratingId } = req.params;
  let { page = 0, limit = 10 } = req.query;

  page = Math.max(0, parseInt(page, 10));
  limit = Math.max(1, Math.min(100, parseInt(limit, 10)));

  if (!mongoose.Types.ObjectId.isValid(ratingId)) {
    return res.status(400).json({ msg: "معرّف التقييم غير صالح." });
  }

  const rating = await RatingModel.findById(ratingId)
    .populate("replies.author", "fullName username photo")
    .lean();

  if (!rating) {
    return res.status(404).json({ msg: "التقييم غير موجود." });
  }

  const totalReplies = rating.replies.length;

  const sorted = rating.replies.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const paged = sorted.slice(page * limit, (page + 1) * limit);

  return res.json({
    totalReplies,
    replies: paged,
    pagination: {
      page,
      limit,
      pages: Math.ceil(totalReplies / limit),
    },
  });
}

module.exports = { getReplies };

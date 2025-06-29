const Rating = require("../../../models/Rating.js");

async function getReplies(req, res) {
  const { ratingId } = req.params;
  const page = Math.max(0, parseInt(req.query.page) || 0);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);

  const rating = await Rating.findById(ratingId)
    .select("replies")
    .populate("replies.author", "username photo")
    .lean();
  if (!rating) return res.status(404).json({ msg: "Rating not found." });

  const total = rating.replies.length;
  const replies = rating.replies
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(page * limit, page * limit + limit);

  res.json({
    data: replies,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

module.exports = { getReplies };

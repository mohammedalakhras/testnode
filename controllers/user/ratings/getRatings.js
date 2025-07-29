const { RatingModel } = require("../../../models/Rating.js");
const mongoose = require("mongoose");

async function getRatings(req, res) {
  const { userId } = req.params;
  let { type = "positive", page = 0, limit = 10 } = req.query;

  page = Math.max(0, parseInt(page, 10));
  limit = Math.max(1, Math.min(100, parseInt(limit, 10)));

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: "معرّف المستخدم غير صالح." });
  }
  if (!["positive", "negative"].includes(type)) {
    return res.status(400).json({ msg: "نوع التقييم غير صالح." });
  }

  const userOid = new mongoose.Types.ObjectId(userId);

  try {
    const totalCount = await RatingModel.countDocuments({
      targetUser: userOid,
    });

    const totalPositiveCount = await RatingModel.countDocuments({
      targetUser: userOid,
      type: "positive",
    });

    const totalNegativeCount = await RatingModel.countDocuments({
      targetUser: userOid,
      type: "negative",
    });

    const starsAgg = await RatingModel.aggregate([
      { $match: { targetUser: userOid, type: "positive" } },
      {
        $group: {
          _id: "$stars",
          count: { $sum: 1 },
        },
      },
    ]);

    const starsStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumStars = 0;
    starsAgg.forEach(({ _id: stars, count }) => {
      starsStats[stars] = count;
      sumStars += stars * count;
    });

    const averageStars =
      totalPositiveCount > 0 ? (sumStars / totalPositiveCount).toFixed(1) : 0;

    const ratings = await RatingModel.find({
      targetUser: userOid,
      type,
    })
      .select("_id targetUser author type text replies")
      .populate("author", "fullName username photo")
      .populate("replies.author", "fullName username photo")
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    return res.json({
      totalCount, //  (positive + negative)
      totalPositiveCount,
      totalNegativeCount,
      starsStats,
      averageStars,
      ratings: ratings.map((r) => {
        const repliesCount = r.replies.length;
        const latestReply = repliesCount
          ? r.replies.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )[0]
          : null;
        return {
          ...r,
          repliesCount,
          latestReply,
        };
      }),
    });
  } catch (err) {
    console.error("Error in getRatings:", err);
    return res.status(500).json({ msg: "خطأ في السيرفر أثناء جلب التقييمات." });
  }
}

module.exports = { getRatings };

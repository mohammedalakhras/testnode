// controllers/user/ratings/getRatings.js

const { RatingModel } = require("../../../models/Rating.js");
const { UserModel } = require("../../../models/User.js");
const mongoose = require("mongoose");

async function getRatings(req, res) {
  const { userId } = req.params;
  const { type = "positive", page = 1, limit = 10 } = req.query;

  if (!["positive", "negative"].includes(type)) {
    return res.status(400).json({ msg: "نوع التقييم غير صالح." });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: "معرف المستخدم غير صالح." });
  }

  try {
    const matchFilter = {
      targetUser: userId,
      type,
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 1) جلب التقييمات مع التصفح
    const ratings = await RatingModel.find(matchFilter)
      .populate("author", "fullName username photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 2) عدد التقييمات لهذا النوع
    const totalCount = await RatingModel.countDocuments(matchFilter);

    // 3) إحصائيات النجوم للتقييمات الإيجابية فقط
    let starsStats = {};
    let averageStars = 0;
    let totalPositiveCount = 0;

    if (type === "positive") {
      const result = await RatingModel.aggregate([
        { $match: { targetUser: new mongoose.Types.ObjectId(userId), type: "positive" } },
        {
          $group: {
            _id: "$stars",
            count: { $sum: 1 },
          },
        },
      ]);

      result.forEach((item) => {
        starsStats[item._id] = item.count;
      });

      // جلب بيانات المتوسط
      const user = await UserModel.findById(userId).select("rate");
      if (user?.rate) {
        totalPositiveCount = user.rate.positiveCount || 0;
        const starsSum = user.rate.starsSum || 0;
        averageStars = totalPositiveCount > 0 ? (starsSum / totalPositiveCount).toFixed(1) : 0;
      }
    }

    return res.json({
      totalCount,             // عدد التقييمات من هذا النوع (type)
      ratings,                // التقييمات نفسها
      starsStats,             // توزيع النجوم (فقط للتقييمات الإيجابية)
      averageStars,           // المتوسط النهائي
      totalPositiveCount,     // عدد التقييمات الإيجابية (للاستخدام في الواجهة)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "خطأ في السيرفر أثناء جلب التقييمات." });
  }
}

module.exports = { getRatings };

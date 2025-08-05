// getRepliesByComment.js
const { CommentModel } = require("../../models/Comment.js");
const hidePhoneIfNotAllowed = require("./hidePhoneIfNotAllowed.js");

/**
 * جلب الردود لتعليق معيّن مع Pagination
 * - params: commentId
 * - query params: page (default=1), limit (default=5)
 * - إخفاء أرقام الهاتف بحسب الصلاحيات (مالك المنتج، صاحب التعليق الأصلي، صاحب الرد نفسه)
 */
async function getRepliesByComment(req, res) {
  try {
    const viewerId = req.user ? req.user.id : null;
    const { commentId } = req.params;
    const { page = 0, limit = 5 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // 1) ابحث عن التعليق كاملًا
    const comment = await CommentModel.findById(commentId)
      .populate("user", "_id") // صاحب التعليق الأصلي
      .populate("replies.user", "_id username fullName")
      .populate({
        path: "product",
        select: "owner",
        populate: { path: "owner", select: "_id" },
      }) // حتى نحصل على owner المنتج
      .lean();

    if (!comment)
      return res.status(404).json({ message: "التعليق غير موجود." });

    const repliesArray = comment.replies || [];
    const totalReplies = repliesArray.length;
    const productOwnerId = comment.product.owner;
    const commentOwnerId = comment.user._id.toString(); // صاحب التعليق الأصلي

    // 2) ترتيب الردود تصاعدي
    repliesArray.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // 3 + 4) Pagination
    const start = pageNum * limitNum;
    const end = start + limitNum;
    const paginatedReplies = repliesArray.slice(start, end);

    // 5) تجهيز الردود مع إخفاء الهاتف في المحتوى
    const processedReplies = paginatedReplies.map((r) => {
      const maskedContent = hidePhoneIfNotAllowed(
        r.content,
        viewerId,
        productOwnerId,
        r.user._id.toString(),
        commentOwnerId
      );
      return {
        _id: r._id,
        content: maskedContent,
        createdAt: r.createdAt,
        user: r.user,
      };
    });

    return res.json({
      totalReplies,
      page: pageNum,
      limit: limitNum,
      replies: processedReplies,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حدث خطأ في السيرفر." });
  }
}

module.exports = getRepliesByComment;

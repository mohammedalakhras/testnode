const { model } = require("mongoose");
const { CommentModel } = require("../../models/Comment.js");
const { default: hidePhoneIfNotAllowed } = require("./hidePhoneIfNotAllowed.js");










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
    const { page = 1, limit = 5 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // 1) ابحث عن التعليق كاملًا (حتى نستطيع جلب كل الردود)
    const comment = await CommentModel.findById(commentId)
      .populate("user", "_id") // هذا صاحب التعليق الأصلي (CommentOwner)
      .populate("replies.user", "username fullName phone _id")
      .populate({
        path: "product",
        select: "owner",
        populate: { path: "owner", select: "_id" },
      }) // حتى نحصل على owner المنتج
      .lean();

    if (!comment) return res.status(404).json({ message: "التعليق غير موجود." });

    const repliesArray = comment.replies || [];
    const totalReplies = repliesArray.length;
    const productOwnerId = comment.product.owner._id.toString();
    const commentOwnerId = comment.user._id.toString(); // صاحب التعليق الأصلي

    // 2) ترتيب الردود تصاعدي (يمكنك عكسه إن أردت الأحدث أولاً)
    repliesArray.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // 3) نحسب البدء والنهاية
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;

    // 4) نأخذ الشريحة المناسبة من المصفوفة
    const paginatedReplies = repliesArray.slice(start, end);

    // 5) نُجهِّز الردود وفق إخفاء الهاتف
    const processedReplies = paginatedReplies.map((r) => {
      const replyUserObj = hidePhoneIfNotAllowed(
        r.user,
        viewerId,
        productOwnerId,
        commentOwnerId
      );
      return {
        _id: r._id,
        content: r.content,
        createdAt: r.createdAt,
        user: replyUserObj,
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

module.exports=getRepliesByComment;

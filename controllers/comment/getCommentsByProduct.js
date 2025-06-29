const { default: mongoose } = require("mongoose");
const { CommentModel } = require("../../models/Comment.js");
const { ProductModel } = require("../../models/Product.js");
const hidePhoneIfNotAllowed = require("./hidePhoneIfNotAllowed.js");

async function getCommentsByProduct(req, res) {
  try {
    const viewerId = req.user ? req.user.id : null; // قد يكون زائر دون تسجيل
    const isAdmin = req.user?.role === "admin";

    console.log("is Admin ?", isAdmin);

    const { productId, page = 0, limit = 2 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ msg: "رقم المنتج غير صحيح." });
    }
    const product = await ProductModel.findById(productId).populate(
      "owner",
      "_id"
    );

    if (!product) return res.status(404).json({ message: "المنتج غير موجود." });
    const productOwnerId = product.owner._id.toString();

    const baseQuery = { product: productId };

    // If not admin, product owner, filter private comments
    if (!viewerId || (!isAdmin && viewerId !== productOwnerId)) {
      // Show public comments OR private comments where viewer is the author
      baseQuery.$or = [
        { private: false },
        ...(viewerId
          ? [{ private: true, user: new mongoose.Types.ObjectId(viewerId) }]
          : []),
      ];
    }

    const totalComments = await CommentModel.countDocuments(baseQuery);

    const comments = await CommentModel.find(baseQuery)
      .sort({ createdAt: 1 })
      .skip(pageNum * limitNum)
      .limit(limitNum)
      .populate({
        path: "user",
        select: "username fullName photo _id",
      })
      .populate({
        path: "replies.user",
        select: "username fullName photo _id",
      })
      .lean()
      .exec();

    console.log(comments);

    const resultComments = comments.map((c) => {
      const repliesCount = Array.isArray(c.replies) ? c.replies.length : 0;

      let slicedReplies = [];
      if (repliesCount > 2) {
        slicedReplies = c.replies
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .slice(0, 2);
      } else {
        slicedReplies = c.replies.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }

      const commentOwnerId = c.user._id.toString();

      const commentUserObj = {
        _id: c.user._id,
        username: c.user.username,
        fullName: c.user.fullName,
      };

      const commentContent = hidePhoneIfNotAllowed(
        c.content,
        viewerId,
        productOwnerId,
        commentOwnerId
      );

      const processedReplies = slicedReplies.map((r) => {
        const replyUserObj = {
          _id: r.user._id,
          username: r.user.username,
          fullName: r.user.fullName,
        };

        const replyContent = hidePhoneIfNotAllowed(
          r.content,
          viewerId,
          productOwnerId,
          r.user._id,
          commentOwnerId
        );

        return {
          _id: r._id,
          content: replyContent,
          createdAt: r.createdAt,
          user: replyUserObj,
        };
      });
      return {
        _id: c._id,
        content: commentContent,
        createdAt: c.createdAt,
        user: commentUserObj,
        private: c.private,
        replies: processedReplies,
        repliesCount,
      };
    });

    return res.json({
      totalComments,
      page: pageNum,
      limit: limitNum,
      comments: resultComments,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حدث خطأ في السيرفر." });
  }
}

module.exports = getCommentsByProduct;

const mongoose = require("mongoose");
const { CommentModel } = require("../../models/Comment.js");

/**
 * Delete a reply from a comment
 * Only the reply owner or the product owner can delete a reply
 */
async function deleteReply(req, res) {
  try {
    const userId = req.user.id;
    const { commentId, replyId } = req.body;
    console.log(commentId);

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ msg: "رقم التعليق غير صالح" });
    }

    if (!mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ msg: "رقم الرد غير صالح" });
    }

    const comment = await CommentModel.findById(commentId).populate({
      path: "product",
      select: "owner",
    });

    if (!comment) {
      return res.status(404).json({ msg: "التعليق غير موجود." });
    }

    // Find the reply
    const replyIndex = comment.replies.findIndex(
      (reply) => reply._id.toString() === replyId
    );

    if (replyIndex === -1) {
      return res.status(404).json({ msg: "الرد غير موجود." });
    }

    const reply = comment.replies[replyIndex];
    const productOwnerId = comment.product.owner.toString();

    // Check if the user is authorized to delete the reply
    // Only the reply owner or the product owner can delete

    if (
      reply.user.toString() !== userId &&
      productOwnerId !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ msg: "غير مصرح لك بحذف هذا الرد." });
    } else {
      // Remove the reply
      comment.replies.splice(replyIndex, 1);
      await comment.save();

      return res.status(200).json({ msg: "تم حذف الرد بنجاح." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "حدث خطأ في السيرفر." });
  }
}

module.exports = deleteReply;

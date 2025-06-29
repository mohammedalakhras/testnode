const { default: mongoose } = require("mongoose");
const { CommentModel } = require("../../models/Comment.js");

async function deleteComment(req, res) {
  try {    
    const userId = req.user.id;
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ msg: "رقم التعليق غير صالح" });
    }

    const comment = await CommentModel.findById(commentId).populate(
      "product",
      "owner"
    );
    if (!comment) return res.status(404).json({ msg: "التعليق غير موجود." });

    const productOwnerId = comment.product.owner.toString();
    const commentOwnerId = comment.user.toString();

    if (
      userId.toString() !== commentOwnerId &&
      // userId.toString() !== productOwnerId &&
      "admin"!==req.user.role
    ) {
      return res.status(403).json({ msg: "ليس لديك صلاحية لحذف هذا التعليق" });
    }

    await CommentModel.findByIdAndDelete(commentId);
    return res.json({ msg: "تم حذف التعليق بنجاح" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "خطأ في السيرفر" });
  }
}

module.exports = deleteComment;

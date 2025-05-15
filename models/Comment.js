const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
); 

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 2000,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  replies: [replySchema],
});

commentSchema.index({ product: 1 });

const CommentModel = mongoose.model("Comment", commentSchema);
module.exports = { CommentModel };

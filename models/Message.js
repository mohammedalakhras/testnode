const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    media: {
      url: { type: String },
      type: {
        type: String,
        enum: ["image", "video", "document", "audio"],
      },
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);



MessageSchema.index({ sender: 1, receiver: 1, sentAt: -1 }); // (1) استعلامات المحادثات مع الترتيب الزمني
MessageSchema.index({ receiver: 1, status: 1 }); // (2) تتبع حالة الرسائل للمستقبلين
MessageSchema.index({ sentAt: -1 }); // (3) استعلامات عامة حسب الوقت (اختياري)


const MessageModel = mongoose.model("Message", MessageSchema);

module.exports = {
  MessageModel,
};

const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  data: { type: Object, default: {} },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
});

// TTL Index:
// احذف كل إشعار انقضى على إنشائه أكثر من 7 أيام
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 3600 }
);

module.exports = mongoose.model("Notification", NotificationSchema);

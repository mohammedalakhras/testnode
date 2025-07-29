const { default: mongoose } = require("mongoose");
const NotificationModel = require("../../models/Notification.js");

/**
 * GET /api/notifications
 * query: page, limit
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    let { page = 0, limit = 10 } = req.query;
    page = Math.max(0, parseInt(page));
    limit = Math.max(1, Math.min(100, parseInt(limit)));

    const filter = { user: userId };
    const total = await NotificationModel.countDocuments(filter);
    const notifs = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    res.json({
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      data: notifs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      msg: "Server Error",
    });
  }
}

/**
 * PATCH /api/notifications/:notifId/read
 * Mark as read
 */
async function markRead(req, res) {
  try {
    const { notifId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(notifId)) {
      return res.status(400).json({ msg: "معرف الإشعار غير صالح" });
    }
    const notif = await NotificationModel.findOne({
      _id: notifId,
      user: userId,
    });
    if (!notif) {
      return res.status(404).json({ msg: "الإشعار غير موجود." });
    }
    notif.read = true;
    await notif.save();
    res.json({ msg: "تم تعليم الإشعار كمقروء." });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      msg: "Server Error",
    });
  }
}

module.exports = { getNotifications, markRead };

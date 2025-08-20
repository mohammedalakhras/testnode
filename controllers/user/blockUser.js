// controllers/user/blockUser.js
const mongoose = require("mongoose");
const { UserModel, validateBlockPayload } = require("../../models/User.js");
const {
  replaceUserKeysWithUrls,
} = require("../../services/replaceUsersKeysWithUrls.js");

const MAX_BLOCKED_USERS = 25;

/**
 * POST /api/users/block
 * body: { userId }
 * access: private
 */
exports.blockUser = async (req, res) => {
  try {
    // 1) Validate payload
    const { error, value } = validateBlockPayload(req.body);
    if (error) {
      return res.status(400).json({ success: false, msg: "Invalid userId" });
    }
    const targetId = value.userId;
    const meId = req.user.id;

    // 2) Prevent self-block
    if (targetId === meId) {
      return res
        .status(400)
        .json({ success: false, msg: "لا يمكنك حظر نفسك." });
    }

    // 3) Ensure target exists
    const targetExists = await UserModel.exists({ _id: targetId });
    if (!targetExists) {
      return res
        .status(404)
        .json({ success: false, msg: "المستخدم المطلوب غير موجود." });
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetId);

    // 4) Try an atomic conditional add: only add if not already present AND blockedUsers size < MAX
    //    This prevents race conditions where two requests could push count over the limit.
    const updated = await UserModel.findOneAndUpdate(
      {
        _id: meId,
        blockedUsers: { $ne: targetObjectId }, // ensure not already blocked
        $expr: { $lt: [{ $size: "$blockedUsers" }, MAX_BLOCKED_USERS] }, // ensure size < MAX
      },
      { $addToSet: { blockedUsers: targetObjectId } },
      { new: true, projection: { blockedUsers: 1 } }
    ).lean();

    if (updated) {
      return res.status(200).json({
        success: true,
        msg: "تم حظر المستخدم بنجاح.",
        blockedCount: (updated.blockedUsers || []).length,
      });
    }

    // 5) If updated === null => either already blocked OR limit reached.
    //    Fetch current state to decide which response to send.
    const me = await UserModel.findById(meId, "blockedUsers").lean();
    const blockedArr = me?.blockedUsers || [];
    const alreadyBlocked = blockedArr.some((id) => id.toString() === targetId);

    if (alreadyBlocked) {
      return res.status(200).json({
        success: true,
        msg: "المستخدم محظور مسبقاً.",
        blockedCount: blockedArr.length,
      });
    }

    // إذا لم يكن محظوراً إذًا السبب غالباً تجاوز الحدّ الأقصى
    if (blockedArr.length >= MAX_BLOCKED_USERS) {
      return res.status(403).json({
        success: false,
        msg: `لا يمكنك حظر أكثر من ${MAX_BLOCKED_USERS} مستخدم.`,
        blockedCount: blockedArr.length,
      });
    }

    // حالة غير متوقعة — نعود بخطأ عام
    return res.status(500).json({
      success: false,
      msg: "فشل في حظر المستخدم لسبب غير متوقع. حاول مجدداً.",
    });
  } catch (err) {
    console.error("blockUser error:", err);
    return res
      .status(500)
      .json({ success: false, msg: err.message || String(err) });
  }
};

/**
 * POST /api/users/unblock
 * body: { userId }
 * access: private
 */
exports.unblockUser = async (req, res) => {
  try {
    // 1) Validate payload
    const { error, value } = validateBlockPayload(req.body);
    if (error) {
      return res.status(400).json({ success: false, msg: "Invalid userId" });
    }
    const targetId = value.userId;
    const meId = req.user.id;

    // Optional: if client attempts to 'unblock' themselves, respond gracefully
    if (targetId === meId) {
      return res
        .status(400)
        .json({ success: false, msg: "لا يمكنك إلغاء حظر نفسك." });
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetId);

    // Use conditional findOneAndUpdate that only modifies if the target is present.
    const updated = await UserModel.findOneAndUpdate(
      { _id: meId, blockedUsers: targetObjectId },
      { $pull: { blockedUsers: targetObjectId } },
      { new: true, projection: { blockedUsers: 1 } }
    ).lean();

    if (!updated) {
      // لم يكن في القائمة — نعيد استجابة ناجحة مع إعلام (idempotent)
      const me = await UserModel.findById(meId, "blockedUsers").lean();
      return res.status(200).json({
        success: true,
        msg: "المستخدم لم يكن محظوراً.",
        blockedCount: me?.blockedUsers?.length || 0,
      });
    }

    // نجح الإلغاء
    return res.status(200).json({
      success: true,
      msg: "تم إلغاء الحظر بنجاح.",
      blockedCount: (updated.blockedUsers || []).length,
    });
  } catch (err) {
    console.error("unblockUser error:", err);
    return res
      .status(500)
      .json({ success: false, msg: err.message || String(err) });
  }
};

/**
 * GET /api/users/blocked
 * access: private
 */

exports.getBlockedUsers = async (req, res) => {
  try {
    const meId = req.user.id;

    const me = await UserModel.findById(meId, "blockedUsers").lean();
    if (!me) {
      return res
        .status(404)
        .json({ success: false, msg: "المستخدم غير موجود." });
    }

    if (!me.blockedUsers || me.blockedUsers.length === 0) {
      return res.status(200).json({ success: true, blocked: [] });
    }

    let blockedUsers = await UserModel.find(
      { _id: { $in: me.blockedUsers } },
      "username fullname photo"
    ).lean();

    for (let u of blockedUsers) {
      if (u.photo) {
        u.photo = await replaceUserKeysWithUrls(u.photo);
      }
    }

    return res.status(200).json({
      success: true,
      blocked: blockedUsers,
      count: blockedUsers.length,
    });
  } catch (err) {
    console.error("getBlockedUsers error:", err);
    return res.status(500).json({ success: false, msg: err.message || err });
  }
};

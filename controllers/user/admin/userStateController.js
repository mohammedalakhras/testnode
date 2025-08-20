// controllers/admin/userStateController.js
const mongoose = require("mongoose");
const {
  UserModel,
  validateSetStatePayload,
} = require("../../../models/User.js");
const {
  createAndSendNotification,
} = require("../../../services/notificationService.js");

const MAX_ALERTS = 3;

/**
 * POST /api/admin/users/:id/alert
 * Add one alert to user (admin action). Atomic:
 * - If user's numberOfAlerts < 3 => increment by 1
 * - If after increment numberOfAlerts >= 3 => set state to "semi-blocked" AND notify user
 * - If user's numberOfAlerts already >= 3 => do NOT increment; return message to admin to block user
 */
exports.incrementAlert = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, msg: "Invalid user id" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, msg: "Unauthorized." });
    }

    // Atomic conditional update: only when numberOfAlerts < MAX_ALERTS
    // Use update pipeline to increment and set state to semi-blocked if threshold reached
    const updated = await UserModel.findOneAndUpdate(
      { _id: userId, numberOfAlerts: { $lt: MAX_ALERTS } },
      [
        { $set: { numberOfAlerts: { $add: ["$numberOfAlerts", 1] } } },
        {
          $set: {
            state: {
              $cond: [
                { $gte: ["$numberOfAlerts", MAX_ALERTS] },
                "semi-blocked",
                "$state",
              ],
            },
          },
        },
      ],
      { new: true, projection: { numberOfAlerts: 1, state: 1, username: 1 } }
    ).lean();

    if (updated) {
      // If we reached threshold -> notify user that they are semi-blocked
      if (updated.numberOfAlerts >= MAX_ALERTS) {
        const payload = {
          title: "حالة الحساب: حظر جزئي",
          body: `تم تطبيق الحظر الجزئي على حسابك بعد وصولك إلى ${MAX_ALERTS} تحذيرات. يرجى مراجعة الدعم أو الإدارة إذا كنت تود الاعتراض.`,
          data: { type: "account_state_changed", state: "semi-blocked" },
        };

        // حاول إنشاء وإرسال الإشعار بدون أن تفشل العملية إذا أخفق الإرسال
        try {
          await createAndSendNotification([userId], payload);
        } catch (notifErr) {
          console.error(
            "Failed to notify user after alert reached max:",
            notifErr
          );
        }

        return res.status(200).json({
          success: true,
          msg: "تم زيادة التنبيه. وصل المستخدم لثلاثة تنبيهات وتم تطبيق الحظر الجزئي (semi-blocked).",
          numberOfAlerts: updated.numberOfAlerts,
          state: updated.state,
        });
      }

      // لم يصل للحد بعد، فقط أبلغ الأدمن بنجاح الزيادة
      return res.status(200).json({
        success: true,
        msg: "تم زيادة التنبيه بنجاح.",
        numberOfAlerts: updated.numberOfAlerts,
        state: updated.state,
      });
    }

    // updated === null => أو أن المستخدم غير موجود أو numberOfAlerts >= MAX_ALERTS
    const user = await UserModel.findById(
      userId,
      "numberOfAlerts state username"
    ).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, msg: "المستخدم غير موجود." });
    }

    if (user.numberOfAlerts >= MAX_ALERTS) {
      return res.status(400).json({
        success: false,
        msg:
          `وصل هذا المستخدم للحد الأقصى من التحذيرات (${MAX_ALERTS}). لا يمكن زيادة التنبيهات أكثر. ` +
          "يرجى تطبيق الحظر الجزئي أو الكلي عبر تغيير الحالة.",
        numberOfAlerts: user.numberOfAlerts,
        state: user.state,
      });
    }

    // Fallback
    return res
      .status(500)
      .json({ success: false, msg: "فشل غير متوقع في زيادة التنبيه." });
  } catch (err) {
    console.error("incrementAlert error:", err);
    return res
      .status(500)
      .json({ success: false, msg: err.message || String(err) });
  }
};

/**
 * PATCH /api/admin/users/:id/state
 * Body: { state: "active"|"semi-blocked"|"blocked" }
 *
 * Rules:
 * - If setting to 'active' => also reset numberOfAlerts to 0.
 * - If setting to 'semi-blocked' or 'blocked' => set state accordingly (leave numberOfAlerts as-is).
 * - Send notification to the user informing them of the change.
 */
exports.setUserState = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, msg: "Invalid user id" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, msg: "Unauthorized." });
    }

    const { error, value } = validateSetStatePayload(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        msg: "Invalid payload",
        details: error.details,
      });
    }

    const { state } = value;
    let update;

    if (state === "active") {
      // إعادة الحساب للوضع الطبيعي => نعيد عدد التنبيهات إلى صفر
      update = { $set: { state: "active", numberOfAlerts: 0 } };
    } else {
      // semi-blocked أو blocked
      update = { $set: { state } };
    }

    const updated = await UserModel.findByIdAndUpdate(userId, update, {
      new: true,
      projection: { state: 1, numberOfAlerts: 1, username: 1 },
    }).lean();

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, msg: "المستخدم غير موجود." });
    }

    // تحضير رسالة الإشعار تبعاً للحالة الجديدة
    let payload;
    const adminName =
      req.user && req.user.username ? req.user.username : "الإدارة";

    if (state === "active") {
      payload = {
        title: "استعادة الحساب",
        body: `تم إعادة حسابك إلى الحالة الطبيعية بواسطة ${adminName}. يمكنك الآن استخدام حسابك بشكل اعتيادي.`,
        data: { type: "account_state_changed", state: "active" },
      };
    } else if (state === "semi-blocked") {
      payload = {
        title: "حالة الحساب: حظر جزئي",
        body: `قام ${adminName} بتطبيق حظر جزئي على حسابك. قد يكون الوصول لبعض الميزات مقيداً. يرجى مراجعة الدعم إذا رغبت بالاعتراض.`,
        data: { type: "account_state_changed", state: "semi-blocked" },
      };
    } else if (state === "blocked") {
      payload = {
        title: "حالة الحساب: محظور",
        body: `قام ${adminName} بحظر حسابك. لا يمكنك الوصول إلى الحساب حالياً. تواصل مع الدعم إذا رغبت بالاعتراض.`,
        data: { type: "account_state_changed", state: "blocked" },
      };
    } else {
      // fallback (shouldn't occur due to validation)
      payload = {
        title: "تغيير حالة الحساب",
        body: `تم تغيير حالة حسابك إلى: ${state}`,
        data: { type: "account_state_changed", state },
      };
    }

    // إرسال الإشعار (حفظ + FCM)
    try {
      await createAndSendNotification([userId], payload);
    } catch (notifErr) {
      // لا نفشل التغيير بسبب فشل الإشعار، فقط نسجل
      console.error(
        "Failed to create/send notification for state change:",
        notifErr
      );
    }

    return res.status(200).json({
      success: true,
      msg: `تم تحديث حالة المستخدم إلى '${updated.state}'.`,
      state: updated.state,
      numberOfAlerts: updated.numberOfAlerts,
    });
  } catch (err) {
    console.error("setUserState error:", err);
    return res
      .status(500)
      .json({ success: false, msg: err.message || String(err) });
  }
};

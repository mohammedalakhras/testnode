const {
  CertificationRequestModel,
} = require("../../../models/CertificationRequest.js");
const mongoose = require("mongoose");
const {
  createAndSendNotification,
} = require("../../../services/notificationService.js");
const { UserModel } = require("../../../models/User.js");

async function changeStatus(req, res) {
  try {
    const { requestID } = req.params;
    const { status, rejectionReason } = req.body;
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "غير مصرح لك بالوصول" });
    }
    if (!["مقبول", "مرفوض"].includes(status)) {
      return res
        .status(400)
        .json({ msg: "status يجب أن تكون 'مقبول' أو 'مرفوض' " });
    }
    if (!mongoose.Types.ObjectId.isValid(requestID)) {
      return res.status(400).json({ msg: "رقم الطلب غير صالح" });
    }
    const cert = await CertificationRequestModel.findById(requestID);
    if (!cert) return res.status(404).json({ msg: "طلب غير موجود" });

    cert.status = status;
    cert.rejectionReason = status === "مرفوض" ? rejectionReason : null;
    await cert.save();
    if (status === "مقبول") {
      try {
        const newVerifiedStatus =
          cert.type === "personal" ? "Verified Account" : "Verified Company";

        await UserModel.findByIdAndUpdate(
          cert.user,
          { verifiedStatus: newVerifiedStatus },
          { new: true, runValidators: true }
        );
      } catch (updateError) {
        console.error(
          "Failed to update user verification status:",
          updateError
        );
        return res
          .status(500)
          .json({ msg: "فشل تغيير حالة الإبلاغ. حاول مرة أخرى.", updateError });
      }
    }
    try {
      const notificationTitle =
        status === "مقبول"
          ? "تم قبول طلب توثيق حسابك"
          : "تم رفض طلب توثيق حسابك";

      const notificationBody =
        status === "مقبول"
          ? "تهانينا! تم توثيق حسابك بنجاح."
          : `تم رفض طلب توثيق حسابك. السبب: ${rejectionReason || "غير محدد"}`;

      const payload = {
        title: notificationTitle,
        body: notificationBody,
        data: {
          requestId: cert._id,
          type: "certification_status_update",
          status: status,
        },
      };

      await createAndSendNotification([cert.user], payload);
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }
    res.json({
      msg: "تم تحديث الحالة",
      cert: {
        _id: cert._id,
        status: cert.status,
        rejectionReason: cert.rejectionReason,
      },
    });
  } catch (error) {
    return res.status(500).json({ msg: "Server Error:", error });
  }
}

module.exports = changeStatus;

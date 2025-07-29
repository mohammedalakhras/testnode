const mongoose = require("mongoose");
const { ReportModel } = require("../../../models/Report.js");
const {
  createAndSendNotification,
} = require("../../../services/notificationService.js");
const { UserModel } = require("../../../models/User.js");

async function changeStatus(req, res) {
  const { reportId } = req.params;
  const { status, rejectionReason } = req.body;
  const validStatuses = ["accepted", "rejected"];

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({ msg: "معرّف الإبلاغ غير صالح." });
  }
  if ("admin" !== req.user.role) {
    return res.status(403).json({ msg: "لا تملك صلاحية للقيام بذلك" });
  }

  const report = await ReportModel.findById(reportId);
  if (!report) {
    return res.status(404).json({ msg: "الإبلاغ غير موجود." });
  }

  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .json({ msg: `الحالة يجب أن تكون 'accepted' أو 'rejected'.` });
  }

  // 4) إذا كان 'rejected' تأكد من وجود سبب الرفض
  if (status === "rejected" && (!rejectionReason || !rejectionReason.trim())) {
    return res
      .status(400)
      .json({ msg: "يرجى توضيح سبب الرفض (rejectionReason)." });
  }

  try {
    report.status = status === "rejected" ? "مرفوض" : "مقبول";
    if (status === "rejected") {
      report.rejectionReason = rejectionReason.trim();
    } else {
      report.rejectionReason = undefined;
    }

    await report.save();

   

    //send Notification
    const notificationTitle =
      status === "accepted" ? "تم قبول إبلاغك" : "تم رفض إبلاغك";

    const notificationBody =
      status === "accepted"
        ? `قام المسؤول بمراجعة إبلاغك وقبوله. شكراً لمشاركتك!`
        : `قام المسؤول بمراجعة إبلاغك ورفضه. السبب: ${rejectionReason}`;

    const payload = {
      title: notificationTitle,
      body: notificationBody,
      data: {
        reportId: report._id,
        type: "report_status_update",
        status: status,
      },
    };

    // إرسال الإشعار للمستخدم الذي قدم الإبلاغ
    await createAndSendNotification([report.reporter.toString()], payload);

    return res.json({
      msg: "تم تحديث حالة الإبلاغ بنجاح.",
      report: {
        _id: report._id,
        status: report.status,
        rejectionReason: report.rejectionReason,
        updatedAt: report.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error changing report status:", err);
    return res
      .status(500)
      .json({ msg: "فشل تغيير حالة الإبلاغ. حاول مرة أخرى." });
  }
}

module.exports = { changeStatus };

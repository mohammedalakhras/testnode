// controllers/admin/reports/getReportDetail.js

const { ReportModel } = require("../../../models/Report.js");
const mongoose = require("mongoose");
const {
  getReportsMediaUrls,
} = require("../../auth/aws/reports/getReportMediaURLs.js");

async function getReportDetail(req, res) {
  const { reportId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({ msg: "معرّف الإبلاغ غير صالح." });
  }
  if ("admin" !== req.user.role) {
    return res.status(403).json({ msg: "لا تملك صلاحية لذلك" });
  }
  const report = await ReportModel.findById(reportId)
    .populate("reporter", "_id username fullName")
    .lean();
  if (!report) {
    return res.status(404).json({ msg: "الإبلاغ غير موجود." });
  }

  // جلب الهدف
  let target;
  if (report.targetType === "product") {
    target = await mongoose
      .model("Product")
      .findById(report.targetId)
      .select("_id title")
      .lean();
  } else {
    target = await mongoose
      .model("User")
      .findById(report.targetId)
      .select("_id username fullName")
      .lean();
  }

  // توليد URL لكل صورة
  const imageUrls = await getReportsMediaUrls(report.images, false);

  res.json({
    _id: report._id,
    reporter: report.reporter,
    target,
    reasonType: report.reasonType,
    text: report.text,
    images: imageUrls,
    status: report.status,
    rejectionReason: report.rejectionReason,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  });
}

module.exports = getReportDetail;

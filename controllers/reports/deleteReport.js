const {ReportModel} = require("../../models/Report.js");
const mongoose = require("mongoose");

async function deleteReport(req, res) {
  const { reportId } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({ msg: "معرّف الإبلاغ غير صالح." });
  }
  const report = await ReportModel.findById(reportId);
  if (!report) {
    return res.status(404).json({ msg: "الإبلاغ غير موجود." });
  }
  if (report.reporter.toString() !== userId && req.user.role!=="admin") {
    return res.status(403).json({ msg: "ليس لديك صلاحية لحذف هذا الإبلاغ." });
  }

  try {
    await report.deleteOne();
    res.json({ msg: "تم حذف الإبلاغ بنجاح." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "فشل حذف الإبلاغ." });
  }
}

module.exports = deleteReport;

const {ReportModel} = require("../../models/Report.js");
const mongoose = require("mongoose");
const { getReportsMediaUrls } = require("../auth/aws/reports/getReportMediaURLs.js");

async function getReports(req, res) {
  const reporter = req.user.id;
  let { page = 0, limit = 10 } = req.query;
  page = Math.max(0, parseInt(page));
  limit = Math.max(1, Math.min(100, parseInt(limit)));

  try {
    const filter = { reporter: new mongoose.Types.ObjectId(reporter) };

    const total = await ReportModel.countDocuments(filter);
    const reports = await ReportModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean()
      .select("createdAt targetType targetId reasonType status");

    // // توليد URLs للصورة الأولى عند الحاجة
    // const keys = reports.flatMap((r) => r.images.slice(0, 1));
    // const urls = await getReportsMediaUrls(keys, false);

    // const data = reports.map((r) => ({
    //   ...r,
    //   imageUrl: r.images.length ? urls.shift() : null,
    // }));

    res.json({
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      // data,
      reports
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "فشل جلب الإبلاغات." });
  }
}

module.exports = getReports;

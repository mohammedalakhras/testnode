const { UserModel } = require("../../models/User.js");
const { ProductModel } = require("../../models/Product.js");
const { ReportModel, validateAddReport } = require("../../models/Report.js");
const mongoose = require("mongoose");
const { report } = require("../../routes/reports.js");

async function addReport(req, res) {
  const { targetType, targetId, reasonType, text, images } = req.body;
  const reporter = req.user.id;

  const { error } = validateAddReport(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  if (!["product", "user"].includes(targetType)) {
    return res.status(400).json({ msg: "targetType غير صالح." });
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ msg: "معرّف الهدف غير صالح." });
  }

  if (!reasonType || !text) {
    return res.status(400).json({ msg: "reasonType و text مطلوبان." });
  }

  const exists = await ReportModel.findOne({
    reporter,
    targetType,
    targetId,
  });

  if (exists) {
    return res.status(400).json({ msg: "لقد سبق وأبلغت عن هذا الهدف من قبل." });
  }

  if (targetType == "product") {
    const prod = await ProductModel.findById(targetId);
    if (!prod) return res.status(404).json({ msg: "المنتج غير موجود" });
  } else {
    const usr = await UserModel.findById(targetId);
    if (!usr) return res.status(404).json({ msg: "المستخدم غير موجود" });
    if (usr._id === reporter)
      return res.status(400).json({ msg: "لا يمكنك تقييم نفسك" });
  }

  try {
    const report = new ReportModel({
      reporter: new mongoose.Types.ObjectId(reporter),
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      reasonType,
      text,
      images: Array.isArray(images) ? images : [],
    });
    await report.save();
    res.status(201).json({ msg: "تم إنشاء الإبلاغ بنجاح.", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "فشل إنشاء الإبلاغ." });
  }
}

module.exports = addReport;

// controllers/admin/reports/getReportsAdmin.js

const { ReportModel } = require("../../../models/Report.js");
const mongoose = require("mongoose");

async function getReportsAdmin(req, res) {
  let { type, page = 0, limit = 10 } = req.query;
  page = Math.max(0, parseInt(page));
  limit = Math.max(1, Math.min(100, parseInt(limit)));

  if (!["product", "user"].includes(type)) {
    return res.status(400).json({ msg: "type يجب أن يكون product أو user." });
  }
 if ("admin"!==req.user.role) {
    return res.status(403).json({ msg: "ليس لديك صلاحية " });
  }
  try {
    const filter = { targetType: type };

    const total = await ReportModel.countDocuments(filter);
    const reports = await ReportModel.find(filter)
      .populate("reporter", "_id username fullName")
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    const populated = await Promise.all(
      reports.map(async (r) => {
        if (type === "product") {
          const prod = await mongoose
            .model("Product")
            .findById(r.targetId)
            .select("_id title")
            .lean();
          r.target = prod;
        } else {
          const user = await mongoose
            .model("User")
            .findById(r.targetId)
            .select("_id username fullName")
            .lean();
          r.target = user;
        }
        delete r.targetId;
        return r;
      })
    );

    res.json({
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      data: populated.map((r) => ({
        _id: r._id,
        reporter: r.reporter,
        target: r.target,
        reasonType: r.reasonType,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "فشل جلب الإبلاغات (admin)." });
  }
}

module.exports = getReportsAdmin;

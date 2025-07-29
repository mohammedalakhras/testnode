const {
  CertificationRequestModel,
} = require("../../../models/CertificationRequest.js");

async function getRequestsAdmin(req, res) {
  let { type, page = 0, limit = 10 } = req.query;
  page = Math.max(0, parseInt(page));
  limit = Math.min(100, parseInt(limit));

  if (req.user.role != "admin") {
    return res.status(403).json({ msg: "ليس لديك صلاحية للقيام بذلك" });
  }
  if (!["personal", "company"].includes(type)) {
    return res.status(400).json({ msg: "type must be personal or company" });
  }

  const filter = { type };

  try {
    const total = await CertificationRequestModel.countDocuments(filter);
    const reqs = await CertificationRequestModel.find(filter)
      // .populate("user", "_id username fullName")
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    const data = reqs.map((r) => {
      return {
        _id: r._id,
        user: r.user,
        status: r.status,
        ...(type === "personal"
          ? {
              fullName: r.personal.fullName,
              bdate: r.personal.bdate,
              idNumber: r.personal.idNumber,
            }
          : {
              companyName: r.company.companyName,
              licenseNumber: r.company.licenseNumber,
            }),
      };
    });

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error" });
  }
}

module.exports = getRequestsAdmin;

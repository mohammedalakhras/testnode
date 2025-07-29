const { default: mongoose } = require("mongoose");
const {
  CertificationRequestModel,
} = require("../../../models/CertificationRequest.js");
const {
  getCertMediaUrls,
} = require("../../auth/aws/verificationRequest/getCertMediaURLs.js");

async function getRequestDetail(req, res) {
  const { id } = req.params;

  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "غير مصرح لك بالوصول" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "رقم الطلب غير صالح" });
  }
  try {
    const cert = await CertificationRequestModel.findById(id)
      .populate("user", "_id username fullName")
      .lean();
    if (!cert) return res.status(404).json({ msg: "طلب غير موجود" });

    const urls = await getCertMediaUrls(cert.images, false);

    const base = {
      _id: cert._id,
      user: cert.user,
      status: cert.status,
      rejectionReason: cert.rejectionReason,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
      images: urls,
    };

    if (cert.type === "personal") {
      return res.json({
        ...base,
        type: "personal",
        fullName: cert.personal.fullName,
        dob: cert.personal.dob,
        idNumber: cert.personal.idNumber,
      });
    } else {
      return res.json({
        ...base,
        type: "company",
        companyName: cert.company.companyName,
        licenseNumber: cert.company.licenseNumber,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server Error" });
  }
}

module.exports = getRequestDetail;

const {
  CertificationRequestModel,
} = require("../../../models/CertificationRequest.js");

async function getMyRequests(req, res) {
  try {
    const userId = req.user.id; 
    const requests = await CertificationRequestModel.find({ user: userId })
      .select("type createdAt status rejectionReason")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.json({ data: requests });
  } catch (error) {
    console.error("Error fetching certification requests:", error);
    return res.status(500).json({
      error: "server error",
      message: error.message || "Failed to retrieve requests",
    });
  }
}

module.exports = getMyRequests;

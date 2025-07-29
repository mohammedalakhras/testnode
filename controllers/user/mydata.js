const { UserModel } = require("../../models/User.js");

exports.me = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id)
      .select("-password -verificationCode -verificationCodeExpires")
      .lean();
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: "User not found",
        });
      }
      
    user.blockedUsers = user.blockedUsers.length;
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

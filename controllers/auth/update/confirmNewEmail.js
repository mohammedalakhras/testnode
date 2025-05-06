const { UserModel } = require("../../../models/User.js");

exports.confirmNewEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await UserModel.findOne({
      _id: req.user.id,
      pendingEmailVerificationCode: code,
    });

    if (
      !user ||
      !user.pendingEmailVerificationExpires ||
      user.pendingEmailVerificationExpires < new Date()
    ) {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid or expired verification code." });
    }

    // swap in the pending email as the official one
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.pendingEmailVerificationCode = undefined;
    user.pendingEmailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, msg: "Your email has been updated." });
  } catch (err) {
    return res.status(500).json({ msg: err });
  }
};

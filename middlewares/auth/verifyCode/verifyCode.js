const {  UserModel } = require("../../../models/User.js");

exports.verifyCode=  async (req, res) => {
  // const { token } = req.params;

  // jwt.verify(token, process.env.JWT_SECRETE_KEY, async function (err, decoded) {
  //   if (err) {
  //     console.log(err);
  //     res.send(
  //       "Email verification failed, possibly the link is invalid or expired"
  //     );
  //   } else {
  //     const user = await UserModel.findByIdAndUpdate(decoded.id, {
  //       $set: { activated: true },
  //     });
  //     res.send("Email verifified successfully");
  //   }
  // });

  const { code } = req.params;

  try {
    const user = await UserModel.findOne({
      email: req.body.email,
      // verificationCode: code,
      activated: false,
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found or activated previously." });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ msg: "Invalid verification code" });
    }
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ msg: "Verification code has expired" });
    }

    user.activated = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();
    res.status(200).json({ msg: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during verification" });
  }
}
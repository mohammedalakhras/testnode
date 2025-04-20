const { UserModel } = require("../../../models/User.js");
const {
  // smtpTransport,
  fillMailBody,
  sendVerificationEmail,
} = require("../../../src/lib/emailVerification.js");

exports.reSendEmailCode = async (req, res) => {
  const { email } = req.body;
  const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();

  const verificationCodeExpires = new Date();
  console.log(verificationCodeExpires);

  verificationCodeExpires.setHours(verificationCodeExpires.getHours() + 24);

  const user = await UserModel.findOneAndUpdate(
    { email: email },
    {
      verificationCode: verificationCode,
      verificationCodeExpires: verificationCodeExpires,
    }
  );
  if (!user) {
    return res.status(404).json({
      success: false,
      msg: "Email is not Registered",
    });
  }
  if (user.activated === true) {
    return res.status(409).json({
      success: false,
      msg: "User Activated Previously, So We will not send Activation Email.",
    });
  }

  const mailOptions = fillMailBody(req, res, user, verificationCode);
  await sendVerificationEmail(mailOptions);
  return res.status(200).json({
    success: true,
    msg: "Email is Sent",
  });
};

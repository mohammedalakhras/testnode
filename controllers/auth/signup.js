const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { validateRegisterUser, UserModel } = require("../../models/User.js");
const {
  // smtpTransport,
  fillMailBody,
  sendVerificationEmail,
} = require("../../src/lib/emailVerification.js");

exports.signup = async (req, res) => {
  try {
    const { error } = validateRegisterUser(req.body);

    if (error) return res.status(400).json({ msg: error.details[0].message });

    const existingUser = await UserModel.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }],
    });
    if (existingUser)
      return res.status(400).json({
        success: false,
        msg: "Email or Username is already registered",
      });

    const salt = bcrypt.genSaltSync(10);
    req.body.password = bcrypt.hashSync(req.body.password, salt);

    // Sanitize the phone number: remove '+' if it exists at the start
    if (req.body.phone && req.body.phone.startsWith("+")) {
      req.body.phone = req.body.phone.slice(1);
    }

    //Generate Verification Code
    const verificationCode = Math.floor(
      10000 + Math.random() * 90000
    ).toString();

    //set 24 houres to expire
    const verificationCodeExpires = new Date();

    verificationCodeExpires.setHours(verificationCodeExpires.getHours() + 24);

    const user = new UserModel({
      ...req.body,
      verificationCode,
      verificationCodeExpires,
    });

    const result = await user.save();

    // const token = jwt.sign(
    //   { id: result._id, email: user.email, username: user.username },
    //   process.env.JWT_SECRETE_KEY,
    //   { expiresIn: "24h" }
    // );

    const mailOptions = fillMailBody(req, res, user, verificationCode);
    await sendVerificationEmail(mailOptions);

    const { password, ...fullUserData } = result._doc;

    const userData = {
      email: fullUserData.email,
      username: fullUserData.username,
      fullName: fullUserData.fullName,
      phone: fullUserData.phone,
      phoneVisible: fullUserData.phoneVisible,
      authProvider: fullUserData.authProvider,
      activated: fullUserData.activated,
    };

    return res.json({
      msg: "تم التسجيل وتم إرسال البريد الإلكتروني للتحقق",
      // token: "Account Must be Activated",
      // token: token,
      userData,
    });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({
        msg: `${Object.keys(error.keyValue)} is already used.`,
      });
    else
      return res.status(500).json({
        msg: "خطأ في الخادم",
        error: error,
      });
  }
};

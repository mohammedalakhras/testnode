const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { validateRegisterUser, UserModel } = require("../models/User.js");
const {
  // smtpTransport,
  fillMailBody,
  sendVerificationEmail,
} = require("../src/lib/emailVerification.js");
var rand, mailOptions, host, link;

/**
 * @description Sign up by [email,username,fullname,password]
 * @route /api/users/signup
 * @method GET
 * @access public
 */

router.post("/signup", async (req, res) => {
  try {
    const { error } = validateRegisterUser(req.body);

    if (error) return res.status(400).json({ msg: error.details[0].message });

    const existingUser = await UserModel.findOne({ email: req.body.email });
    if (existingUser)
      return res.status(400).json({
        success: false,
        msg: "Email is already registered",
      });

    const salt = bcrypt.genSaltSync(10);
    req.body.password = bcrypt.hashSync(req.body.password, salt);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new UserModel({
      ...req.body,
      verificationCode,
    });

    const result = await user.save();

    // const token = jwt.sign(
    //   { id: result._id, email: user.email, username: user.username },
    //   process.env.JWT_SECRETE_KEY,
    //   { expiresIn: "24h" }
    // );

    const mailOptions = fillMailBody(req, res, user, verificationCode);
    await sendVerificationEmail(mailOptions);

    const { password, ...userData } = result._doc;

    return res.json({
      msg: "User Registered and Email is Sent",
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
        msg: "Server Error",
        error: error,
      });
  }
});

router.post("/verify/:code", async (req, res) => {
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
      verificationCode: code,
      activated: false,
    });
    if (!user) {
      return res
        .status(404)
        .json({ msg: "Verification failed: Invalid or expired code." });
    }
    user.activated = true;
    user.verificationCode = undefined;
    await user.save();
    res.status(200).json({ msg: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during verification" });
  }
});

router.post("/verifyEmail", async (req, res) => {
  const { email } = req.body;
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const user = await UserModel.findOneAndUpdate(
    { email: email },
    { verificationCode: verificationCode }
  );
  if (!user) {
    return res.status(404).json({
      success: false,
      msg: "Email is not Registered",
    });
  }

  const mailOptions = fillMailBody(req, res, user, verificationCode);
  await sendVerificationEmail(mailOptions);
  return res.status(200).json({
    success: true,
    msg: "Email is Sent",
  });
});
module.exports = router;

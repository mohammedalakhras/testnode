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

/**
 * @description Sign up by [email,username,fullname,password]
 * @route /api/users/signup
 * @method POST
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

    //Generate Verification Code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
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

/**
 * @description verify email using rercived code
 * @route /api/users//verify/:code
 * @method POST
 * @access public
 */
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
      // verificationCode: code,
      activated: false,
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
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
});

/**
 * @description re-send email verification code
 * @route /api/users/verifyEmail
 * @method POST
 * @access public
 */
router.post("/verifyEmail", async (req, res) => {
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
});

/**
 * @description Sign in using [email, username, phone] and password
 * @route /api/users/signin
 * @method POST
 * @access public
 */

router.post("/signin", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        msg: "All Fields is Required",
      });
    }

    const user = await UserModel.findOne({
      $or: [
        { email: String(identifier).toLowerCase() },
        { username: String(identifier).toLowerCase() },
        { phone: identifier },
      ],
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User Not Exsits ",
      });
    }

    if (!user.activated) {
      return res.status(403).json({
        success: false,
        msg: "Account is not Activated",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        msg: "incorrect Password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRETE_KEY
      // { expiresIn: "24h" }
    );

    const { password: _, ...userData } = user._doc;

    return res.status(200).json({
      success: true,
      msg: "signin successfully",
      token,
      userData,
    });
  } catch (error) {
    console.error("Sigin in Error", error);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
    });
  }
});

const { verifyToken } = require("../middlewares/verifyToken.js");

/**
 * @description Get authenticated user data
 * @route /api/users/me
 * @method GET
 * @access private
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select(
      "-password -verificationCode -verificationCodeExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

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
});

/**
 * @description Validate token
 * @route /api/users/validate-token
 * @method POST
 * @access private
 */
router.post("/validate-token", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
module.exports = router;

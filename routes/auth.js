const express = require("express");
const router = express.Router();

// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

const { validateRegisterUser, UserModel } = require("../models/User.js");
const {
  // smtpTransport,
  fillMailBody,
  sendVerificationEmail,
} = require("../src/lib/emailVerification.js");

const { signup } = require("../middlewares/auth/signup.js");
const { signin } = require("../middlewares/auth/signin.js");

const { verifyCode } = require("../middlewares/auth/verifyCode/verifyCode.js");
const { reSendEmailCode } = require("../middlewares/auth/email/reSendCode.js");
const {
  forgetPassword,
} = require("../middlewares/auth/email/forgetPassword.js");

const { verifyToken } = require("../middlewares/token/verifyToken.js");
const { me } = require("../middlewares/user/mydata.js");
const {
  verifyResetCode,
} = require("../middlewares/auth/verifyCode/verifyResetCode.js");
const { resetPassword } = require("../middlewares/auth/resetPassword.js");
const {
  updateProfile,
} = require("../middlewares/auth/update/updateProfile.js");
const {
  confirmNewEmail,
} = require("../middlewares/auth/update/confirmNewEmail.js");
const { sendNotification } = require("../src/lib/notificationService.js");

/**
 * @description Sign up by [email,username,fullname,password]
 * @route /api/users/signup
 * @method POST
 * @access public
 */

router.post("/signup", signup);

/**
 * @description verify email using rercived code
 * @route /api/users//verify/:code
 * @method POST
 * @access public
 */
router.post("/verify/:code", verifyCode);

/**
 * @description re-send email verification code
 * @route /api/users/verifyEmail
 * @method POST
 * @access public
 */
router.post("/verifyEmail", reSendEmailCode);

/**
 * @description Sign in using [email, username, phone] and password
 * @route /api/users/signin
 * @method POST
 * @access public
 */

router.post("/signin", signin);

/**
 * @description Forget Password Request that will send Code by email.
 *              body must have: {email}
 * @route /api/users/forgetPassword
 * @method POST
 * @access public
 */
router.post("/forgetPassword", forgetPassword);

/**
 * @description Verify Reset Password Code.
 *              body must have:{ email, code }
 * @route /api/users/verifyResetCode
 * @method POST
 * @access public
 */
router.post("/verifyResetCode", verifyResetCode);

/**
 * @description re-set new Password.
 *              body must have:{email,code,password}
 * @route /api/users/resetPassword
 * @method POST
 * @access public
 */
router.post("/resetPassword", resetPassword);

/**
 * @description Get authenticated user data
 * @route /api/users/me
 * @method GET
 * @access private
 */
router.get("/me", verifyToken, me);

/**
 * @description Validate token
 * @route /api/users/validate-token
 * @method POST
 * @access private
 */
router.post("/validate-token", verifyToken, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

/**
 * @description Update Profile Info
 * @route /api/users/update
 * @method POST
 * @access private
 */
router.post("/update", verifyToken, updateProfile);

/**
 * @description Update Profile Info
 * @route /api/users/update
 * @method POST
 * @access private
 */
router.post("/confirmNewEmail", verifyToken, confirmNewEmail);

/**
 * @description Send Notification to Specific Device By FCM Token
 * @route /api/users/sendNotification
 * @method POST
 * @access public
 */

router.post("/sendNotification", async (req, res) => {
  const { tokens, title, body, data } = req.body;
  try {
    const result = await sendNotification(tokens, { title, body, data });
    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("FCM Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

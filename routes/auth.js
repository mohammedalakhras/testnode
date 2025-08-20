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

const { signup } = require("../controllers/auth/signup.js");
const { signin } = require("../controllers/auth/signin.js");

const { verifyCode } = require("../controllers/auth/verifyCode/verifyCode.js");
const { reSendEmailCode } = require("../controllers/auth/email/reSendCode.js");
const {
  forgetPassword,
} = require("../controllers/auth/email/forgetPassword.js");

const { verifyToken } = require("../middlewares/token/verifyToken.js");
const { me } = require("../controllers/user/mydata.js");
const {
  verifyResetCode,
} = require("../controllers/auth/verifyCode/verifyResetCode.js");
const { resetPassword } = require("../controllers/auth/resetPassword.js");
const {
  updateProfile,
} = require("../controllers/auth/update/updateProfile.js");
const {
  confirmNewEmail,
} = require("../controllers/auth/update/confirmNewEmail.js");
const { sendNotification } = require("../src/lib/notificationService.js");
const { getUserById } = require("../controllers/user/getUserDataById.js");
const {
  getUploadUrlUser,
} = require("../controllers/auth/aws/users/getUploadUrlUser.js");
const {
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require("../controllers/user/blockUser.js");

const {
  verifyNotBlocked,
} = require("../middlewares/token/verifyNotBlocked.js");
const { fillRole } = require("../middlewares/admin/fillRole.js");
const {
  incrementAlert,
  setUserState,
} = require("../controllers/user/admin/userStateController.js");

/**
 * @description Sign up by [email,username,fullname,password]
 * @route /api/users/signup
 * @method POST
 * @access public
 */

router.post("/signup", signup);
/**
 * @description GET Upload URL
 * @route /api/users/uploadURL
 * @method POST
 * @access public
 */

router.post("/uploadUrl", getUploadUrlUser);

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
 * @description Get user data
 * @route /api/users/data/:id
 * @method GET
 * @access private
 */
router.get("/data/:id", getUserById);

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
 * @description Block a user (adds to blockedUsers)
 * @route /api/users/block
 * @method POST
 * @access private
 * body: { userId }
 */
router.post("/block", verifyNotBlocked, blockUser);
/**
 * @description GET blocked users by me.
 * @route /api/users/blocked
 * @method GET
 * @access private
 */
router.get("/blocked", verifyToken, getBlockedUsers);

/**
 * @description Unblock a user (removes from blockedUsers)
 * @route /api/users/unblock
 * @method POST
 * @access private
 * body: { userId }
 */
router.post("/unblock", verifyNotBlocked, unblockUser);

//admin
/**
 * @description increment Alert for user by admin
 * @route /api/users/admin/:id/alert
 * @method POST
 * @access private
 */
router.post("/admin/:id/alert", verifyToken, fillRole, incrementAlert);

/**
 * @description setUserState
 * @route /api/users/admin/:id/state
 * @method PATCH
 * @access private
 * Body: { state: "active"|"semi-blocked"|"blocked" }
 */
router.patch("/admin/:id/state", verifyToken, fillRole, setUserState);

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

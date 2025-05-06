const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { UserModel } = require("../../models/User.js");

exports.signin = async (req, res) => {
  try {
    const { identifier, password, fcmToken } = req.body;

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

    // Store the FCM token if provided
    if (fcmToken) {
      await UserModel.updateOne(
        { _id: user._id },
        { $addToSet: { fcmTokens: fcmToken } }
      );
    }
    
    const token = jwt.sign(
      {
        id: user._id,
        // email: user.email,
        // username: user.username,
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
};

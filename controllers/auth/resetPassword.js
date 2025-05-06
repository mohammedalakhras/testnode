
const bcrypt = require("bcryptjs");
const { UserModel } = require("../../models/User.js");

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ msg: "Email, resetCode and newPassword are required." });
    }
   
    const user = await UserModel.findOne({ 
      email: email.toLowerCase(), 
      passwordResetCode: code 
    });
    if (!user) {
      return res.status(404).json({ msg: "Invalid email or reset code." });
    }

    if (user.passwordResetExpires < new Date()) {
      return res.status(400).json({ msg: "Reset code has expired." });
    }

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(password, salt);

    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return res.status(200).json({ msg: "Password has been updated successfully." });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ msg: "Server error while resetting password.",error:error });
  }
};
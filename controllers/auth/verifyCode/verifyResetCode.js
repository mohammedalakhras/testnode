const { UserModel } = require("../../../models/User.js");

exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ msg: "Email and code are required." });
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
    
    return res.status(200).json({ msg: "Reset code is valid." });
  } catch (error) {
    console.error("Error in verifyResetCode:", error);
    return res.status(500).json({ msg: "Server error during reset code verification." });
  }
};
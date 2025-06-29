const { UserModel } = require("../../models/User");

async function fillUsername(req, res, next) {
  try {
    if (req.user) {
      const username = await UserModel.findById(req.user.id).select("username");

      if (!username) {
        return res
          .status(403)
          .json({ msg: "حساب المستخدم الحالي غير موجود او يحوي خطأ." });
      } else {
        req.user.username = username.username;
        next();
      }
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({ msg: "حدث خطأ غير متوقع" });
  }
}

module.exports = { fillUsername };

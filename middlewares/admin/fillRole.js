const { UserModel } = require("../../models/User");

async function fillRole(req, res, next) {
  try {
    if (req.user) {
      const userRole = await UserModel.findById(req.user.id).select("role");

      if (!userRole) {
        return res
          .status(403)
          .json({ msg: "حساب المستخدم الحالي غير موجود او يحوي خطأ." });
      } else {
        req.user.role = userRole.role;
        next();
      }
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({ msg: "حدث خطأ غير متوقع" });
  }
}

module.exports = { fillRole };

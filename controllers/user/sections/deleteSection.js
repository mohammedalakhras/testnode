const { UserModel } = require("../../../models/User.js");

async function deleteSection(req, res) {
  const userId = req.user.id;
  const { sectionId } = req.params;

  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ msg: "المستخدم غير موجود." });

  const section = user.sections.id(sectionId);
  if (!section) return res.status(404).json({ msg: "القسم غير موجود." });

  section.remove();
  await user.save();
  res.json({ msg: "تم حذف القسم بنجاح." });
}
module.exports = { deleteSection };

const { validateSection, UserModel } = require("../../../models/User.js");

async function addSection(req, res) {
  const userId = req.user.id;
  const { order, name, content, keys } = req.body;

  // 1) Validation
  const { error } = validateSection({ order, name, content, keys });
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  // 2) جلب المستخدم
  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ msg: "المستخدم غير موجود." });

  if (userId !== user._id.toString()) {
    return res.status(403).json({ msg: "لا تملك صلاحية لذلك" });
  }
  // 3) لا يمكن زيادة عن 6
  if (user.sections.length >= 6) {
    return res.status(400).json({ msg: "لا يمكنك إضافة أكثر من 6 أقسام." });
  }

  // 4) أضف القسم
  user.sections.push({ order, name, content, keys });
  await user.save();

  res.status(201).json({
    msg: "تم إضافة القسم بنجاح.",
    section: user.sections.slice(-1)[0],
  });
}
module.exports = { addSection };

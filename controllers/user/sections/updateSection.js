// controllers/user/sections/updateSection.js

const { UserModel, validateUpdateSection } = require("../../../models/User.js");
const { default: mongoose } = require("mongoose");

async function updateSection(req, res) {
  const userId = req.user.id;
  const { sectionId } = req.params;
  const updates = req.body;

  const { error } = validateUpdateSection(updates);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    return res.status(400).json({ msg: "رقم القسم غير صالح." });
  }
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ msg: "المستخدم غير موجود." });
  }
  if (userId !== user._id.toString()) {
    return res.status(403).json({ msg: "لا تملك صلاحية لذلك" });
  }

  const section = user.sections.id(sectionId);
  if (!section) {
    return res.status(404).json({ msg: "القسم غير موجود." });
  }

  if (updates.order !== undefined) section.order = updates.order;
  if (updates.name !== undefined) section.name = updates.name;
  if (updates.content !== undefined) section.content = updates.content;
  if (updates.keys !== undefined) {
    const newKeysMap = new Map(Object.entries(updates.keys));
    for (const [key, value] of newKeysMap) {
      section.keys.set(key, value);
    }
  }

  await user.save();
  res.json({ msg: "تم تعديل القسم بنجاح.", section });
}

module.exports = { updateSection };

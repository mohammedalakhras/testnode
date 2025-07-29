const { UserModel } = require("../../../models/User.js");
const { resolveContentUrls } = require("../../../services/sectionService.js");

async function getSections(req, res) {
  const userId = req.params.userId || req.user.id;
  const user = await UserModel.findById(userId).lean();
  if (!user) return res.status(404).json({ msg: "المستخدم غير موجود." });

  // 1) للكل: ننشئ نسخة مع content محلولة
  const sections = await Promise.all(
    user.sections
      .sort((a, b) => a.order - b.order)
      .map(async (sec) => {
        console.log(sec);

        const resolved = await resolveContentUrls(sec.content, sec.keys);
        return {
          _id: sec._id,
          order: sec.order,
          name: sec.name,
          content: resolved,
        };
      })
  );

  res.json({ sections });
}

module.exports = { getSections };

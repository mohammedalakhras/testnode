// controllers/products/getUserProducts.js
const mongoose = require("mongoose");
const { ProductModel } = require("../../models/Product.js");
const { getMediaUrls } = require("../auth/aws/products/getProductMediaUrls.js");
const {
  replaceUserKeysWithUrls,
} = require("../../services/replaceUsersKeysWithUrls.js");

exports.getUserProducts = async (req, res) => {
  try {
    const { userId } = req.params; // نأخذ الـ userId من params (مثلاً /products/user/:userId)
    if (!userId) {
      return res.status(400).json({ msg: "userId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "userId is not valid" });
    }

    const page = Number(req.query.page ?? 0);
    const limit = Number(req.query.limit ?? 8);
    const skip = page * limit;

    const filter = { owner: new mongoose.Types.ObjectId(userId) };

    const total = await ProductModel.countDocuments(filter);

    const products = await ProductModel.find(filter)
      .select(
        "title description price category owner location market condition status images tags expiresAt createdAt"
      )
      .populate("owner", "username photo rate")
      .populate({
        path: "location.location",
        select: "name ancestors",
        populate: { path: "ancestors", select: "name" },
      })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // تجهيز مفاتيح الصور (الصورة الأولى low لكل منتج)
    const keys = products
      .map((p) => p.images?.[0]?.low?.replace?.("products/", ""))
      .filter(Boolean);

    const urls = keys.length ? await getMediaUrls(keys) : [];

    // إلحاق رابط الصورة الأولى
    const updatedProducts = await Promise.all(
      products.map(async (p) => {
        const rawKey = p.images?.[0]?.low?.replace?.("products/", "") || null;
        let image = null;
        if (rawKey) {
          const pos = keys.indexOf(rawKey);
          image = pos >= 0 ? urls[pos] : null;
        }

        // ✅ استبدال صورة المستخدم
        if (p.owner?.photo) {
          p.owner.photo = await replaceUserKeysWithUrls(p.owner.photo);
        }

        p.image = image ?? null;
        return p;
      })
    );

    return res.json({
      data: updatedProducts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in getUserProducts:", err);
    return res.status(500).json({ msg: "خطأ في جلب منتجات المستخدم المحدد." });
  }
};

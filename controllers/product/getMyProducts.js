const mongoose = require("mongoose");
const { ProductModel } = require("../../models/Product.js");
const { getMediaUrls } = require("../auth/aws/products/getProductMediaUrls.js");

exports.getMyProducts = async (req, res) => {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const page = Number(req.query.page ?? 0);
    const limit = Number(req.query.limit ?? 8);
    const skip = page * limit;

    const filter = { owner: new mongoose.Types.ObjectId(viewerId) };

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

    // تحضير مفاتيح الصور (الصورة الأولى low لكل منتج)
    const keys = products
      .map((p) => p.images?.[0]?.low?.replace?.("products/", ""))
      .filter(Boolean);

    const urls = keys.length ? await getMediaUrls(keys) : [];

    // إلحاق رابط الصورة (image) لكل منتج أو null
    const updatedProducts = products.map((p) => {
      const rawKey = p.images?.[0]?.low?.replace?.("products/", "") || null;
      let image = null;
      if (rawKey) {
        const pos = keys.indexOf(rawKey);
        image = pos >= 0 ? urls[pos] : null;
      }
      return { ...p, image: image ?? null };
    });

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
    console.error("Error in getMyProducts:", err);
    return res.status(500).json({ msg: "خطأ في جلب منتجات المستخدم." });
  }
};

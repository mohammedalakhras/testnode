// controllers/products/getFolloweesProducts.js
const mongoose = require("mongoose");
const { Follow } = require("../../models/Follow.js");
const { ProductModel } = require("../../models/Product.js");
const { getMediaUrls } = require("../auth/aws/products/getProductMediaUrls.js");

exports.getFolloweesProducts = async (req, res) => {
  try {
    const viewerId = req.user?.id;
    if (!viewerId) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const page = Number(req.query.page ?? 0);
    const limit = Number(req.query.limit ?? 10);
    const skip = page * limit;

    // 1) جلب قائمة الذين يتابعهم المشاهد
    const follows = await Follow.find({ follower: viewerId }).select("followee").lean();
    const followeeIds = follows.map((f) => f.followee).filter(Boolean);

    // إذا لا يتابع أحد نعيد مصفوفة فارغة مباشرة
    if (!followeeIds.length) {
      return res.json({
        data: [],
        pagination: { total: 0, page, limit, pages: 0 },
      });
    }

    // 2) فلتر المنتجات — هنا نستخدم فقط شرط owner in followees + expire
    const filter = {
      owner: { $in: followeeIds },
      expiresAt: { $gt: new Date() }, // قابل للإزالة إذا تريد منتجات حتى لو انتهت
      // يمكنك إضافة شروط أخرى مثل status/isSold إذا رغبت
    };

    // 3) جلب العدد الإجمالي ثم الصفحة المطلوبة
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
      .lean();

    // 4) توليد روابط الصور (نأخذ الصورة الأولى low لكل منتج)
    const keys = products
      .map((p) => p.images?.[0]?.low?.replace?.("products/", ""))
      .filter(Boolean);

    const urls = keys.length ? await getMediaUrls(keys) : [];

    // 5) إلحاق الـ image url لكل منتج (أو null إن لم توجد)
    const updatedProducts = products.map((p, idx) => {
      // حاول إيجاد رابط مطابق حسب index في قائمة keys
      // نستخدم نفس الترتيب: keys بني على ترتيب products مع فلترة null
      // لذا نحتاج حساب indexToUse
      let image = null;
      const rawKey = p.images?.[0]?.low?.replace?.("products/", "");
      if (rawKey) {
        // إيجاد موضع rawKey في keys
        const pos = keys.indexOf(rawKey);
        image = pos >= 0 ? urls[pos] : null;
      }
      return { ...p, image: image ? image : null };
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
    console.error("Error in getFolloweesProducts:", err);
    return res.status(500).json({ msg: "خطأ في جلب منتجات المتابعين" });
  }
};

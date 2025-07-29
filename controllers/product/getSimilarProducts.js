const mongoose = require("mongoose");
const { ProductModel } = require("../../models/Product.js");
const { getMediaUrls } = require("../auth/aws/products/getProductMediaUrls.js");

exports.getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "معرّف المنتج غير صالح." });
    }

    const original = await ProductModel.findById(id).lean();
    if (!original) {
      return res.status(404).json({ msg: "المنتج غير موجود." });
    }

    // 2) حقول لفلترة المنتجات المقبولة وغير نفسها
    const baseMatch = {
      _id: { $ne: original._id },
      //   status: "Approved",
      expiresAt: { $gt: new Date() },
      //   isSold: false,
    };

    // 3) تجميع aggregation لحساب score
    const pipeline = [
      { $match: baseMatch },
      {
        $addFields: {
          // نقاط الصنف
          categoryScore: {
            $cond: [{ $eq: ["$category", original.category] }, 5, 0],
          },
          // نقاط البائع
          ownerScore: {
            $cond: [{ $eq: ["$owner", original.owner] }, 4, 0],
          },
          // نقاط المنطقة
          locationScore: {
            $cond: [
              { $eq: ["$location.location", original.location.location] },
              3,
              0,
            ],
          },
          // نقاط الوسوم: عدد المشترك منها
          tagsScore: {
            $size: {
              $setIntersection: ["$tags", original.tags || []],
            },
          },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              "$categoryScore",
              "$ownerScore",
              "$locationScore",
              "$tagsScore",
            ],
          },
        },
      },
      // استبعاد المنتجات التي مجموع نقاطها صفر (اختياري)
      { $match: { score: { $gt: 0 } } },
      // ترتيب حسب أعلى Score ثم الأحدث
      { $sort: { score: -1, createdAt: -1 } },
      // نكتفي بأربعة
      { $limit: 4 },
      // استرجاع الحقول الضرورية
      {
        $project: {
          title: 1,
          price: 1,
          market:1,
          images: 1,
          owner: 1,
          category: 1,
          location: 1,
          tags: 1,
          score: 1,
        },
      },
    ];

    let similar = await ProductModel.aggregate(pipeline);
    similar = await ProductModel.populate(similar, [
      { path: "owner", select: "username photo rate" },
      { path: "category", select: "name" },
      {
        path: "location.location",
        select: "name",
        model: "Location", // ضروري لأن حقل location هو object فيه فرع location
      },
    ]);
    // 4) توليد روابط الصور
    const keys = similar
      .map((p) => p.images[0]?.low.replace("products/", ""))
      .filter(Boolean);
    const urls = await getMediaUrls(keys);

    // 5) إلحاق URLs في كل منتج
    similar = similar.map((p, i) => ({
      ...p,
      image: urls[i] || null,
    }));

    return res.json({ data: similar });
  } catch (err) {
    console.error("Error fetching similar products:", err);
    return res.status(500).json({ msg: "خطأ في جلب المنتجات المشابهة." });
  }
};

const { default: mongoose } = require("mongoose");
const { LocationModel } = require("../../models/Location.js");
const { ProductModel } = require("../../models/Product.js");
const { getMediaUrls } = require("../auth/aws/products/getProductMediaUrls.js");

exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      location,
      search,
      minSYPPrice,
      maxSYPPrice,
      minUSDPrice,
      maxUSDPrice,
      condition,
      market,
      tags,
      page = 0,
      limit = 10,
    } = req.query;

    // Base filter
    const filter = {
      // status: "Approved", // يجب تفعيل هذا الشرط
      // isSold: false,      // يجب تفعيل هذا الشرط
      expiresAt: { $gt: new Date() },
    };

    if (category) filter.category = new mongoose.Types.ObjectId(category);

    if (condition) {
      const conditions = Array.isArray(condition)
        ? condition
        : condition.split(",").map((c) => c.trim());

      filter.condition = { $in: conditions };
    }
    if (market) {
      if (market == "true") {
        filter.market = true;
      } else {
        filter.market = false;
      }
    }

    if (location) {
      // 1) نحول الباراميتر array أو comma-separated string إلى مصفوفة من الـ IDs
      const locArray = Array.isArray(location)
        ? location
        : location.split(",").map((s) => s.trim());

      // 2) نجمع لكل ID جميع الـ descendants
      const allLocIds = [];
      for (const loc of locArray) {
        const locId = new mongoose.Types.ObjectId(loc);
        allLocIds.push(locId);

        const descendants = await LocationModel.find({ ancestors: locId })
          .select("_id")
          .lean();

        descendants.forEach((d) => allLocIds.push(d._id));
      }

      // 3) نستخدم $in على كل الإيديهات المجمعة
      filter["location.location"] = { $in: allLocIds };
    }

    // if (minPrice || maxPrice) {
    //   filter["price.amount"] = {};
    //   if (minPrice) filter["price.amount"].$gte = Number(minPrice);
    //   if (maxPrice) filter["price.amount"].$lte = Number(maxPrice);
    // }

    const moneyFilters = [];

    // SYP range
    if (minSYPPrice || maxSYPPrice) {
      const sypFilter = {
        "price.currency": "SYP",
        "price.amount": {},
      };
      if (minSYPPrice != null)
        sypFilter["price.amount"].$gte = Number(minSYPPrice);
      if (maxSYPPrice != null)
        sypFilter["price.amount"].$lte = Number(maxSYPPrice);
      moneyFilters.push(sypFilter);
    }

    // USD range
    if (minUSDPrice || maxUSDPrice) {
      const usdFilter = {
        "price.currency": "USD",
        "price.amount": {},
      };
      if (minUSDPrice != null)
        usdFilter["price.amount"].$gte = Number(minUSDPrice);
      if (maxUSDPrice != null)
        usdFilter["price.amount"].$lte = Number(maxUSDPrice);
      moneyFilters.push(usdFilter);
    }
    // إذا تم تمرير أي مرشح سعري، نستخدم $or لجلب أي منتج يطابق واحداً من النطاقين
    if (moneyFilters.length) {
      filter.$or = moneyFilters;
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(",");
      filter.tags = { $all: tagsArray.map((t) => t.trim().toLowerCase()) };
    }

    let query = ProductModel.find(filter)
      .populate("owner", "username photo rate")
      .populate("location.location", "name")
      .populate("category", "name");
    // Text search
    if (search) {
      query = query.find({ $text: { $search: search } });
      query = query.sort({ score: { $meta: "textScore" } });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    // الحصول على الفلتر النهائي بعد كل التعديلات
    const queryFilter = query.getFilter();

    // Pagination
    const skip = Number(page) * Number(limit);
    query = query.skip(skip).limit(Number(limit));

    // const products = await query.exec();
    const products = await ProductModel.find(queryFilter)
      .select(
        "title description price category owner location market condition status images tags expiresAt"
      )
      .populate("owner", "username photo rate")
      .populate("location.location", "name")
      .populate("category", "name")
      .lean()
      .exec();

    const updatedProduct = await Promise.all(
      products.map(async (e) => {
        const img = e.images[0].low.replace("products/", "");

        return { ...e, images: [await getMediaUrls(img)] };
      })
    );

    const total = await ProductModel.countDocuments(queryFilter); // استخدام الفلتر المعدل

    res.json({
      data: updatedProduct,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ msg: "خطأ في جلب المنتجات" });
  }
};

const express = require("express");
const router = express.Router();
const { default: mongoose } = require("mongoose");

const { verifyToken } = require("../middlewares/token/verifyToken.js");
const {
  ProductModel,
  validateProduct,
  validateUpdateProduct,
} = require("../models/Product.js");
const { UserModel } = require("../models/User.js");
const { LocationModel } = require("../models/Location.js");
const {
  getUploadUrlProduct,
} = require("../controllers/auth/aws/products/getUploadUrlProduct.js");
const s3 = require("../src/config/aws.js");

router.post("/uploadURL", verifyToken, getUploadUrlProduct);

// Create a new product (requires admin approval)
router.post("/", verifyToken, async (req, res) => {
  try {
    // Validate request body

    const { error } = await validateProduct(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    // Check seller status
    console.log("product");
    const seller = await UserModel.findById(req.user.id);
    if (!seller || seller.state !== "active") {
      return res.status(403).json({ msg: "الحساب غير نشط أو غير موجود" });
    }

    // Create product with default status Pending and isSold=false
    if (
      req.body.title &&
      req.body.description &&
      req.body.category &&
      req.body.location &&
      req.body.condition &&
      req.body.images
    ) {
      const product = new ProductModel({
        ...req.body,
        owner: req.user.id,
        isSold: false,
      });

      await product.save();
      res.status(201).json({ msg: "تم إضافة المنتج بنجاح", product });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "خطأ في إضافة المنتج", error: error });
  }
});

// Fetch products with filters, pagination, and text search
router.get("/", async (req, res) => {
  try {
    const {
      category,
      location,
      search,
      minSYPPrice,
      maxSYPPrice,
      minUSDPrice,
      maxUSDPrice,
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

    if (location) {
      const locId = new mongoose.Types.ObjectId(location);
      const descendants = await LocationModel.find({ ancestors: locId })
        .select("_id")
        .lean();
      const locIds = [locId, ...descendants.map((d) => d._id)];
      filter["location.location"] = { $in: locIds };
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

    const products = await query.exec();
    const total = await ProductModel.countDocuments(queryFilter); // استخدام الفلتر المعدل

    res.json({
      data: products,
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
});

// Update product (owner or admin)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "المنتج غير موجود" });

    const user = await UserModel.findById(req.user.id).select("role");
    if (product.owner.toString() !== req.user.id && user.role !== "admin") {
      return res.status(403).json({ msg: "غير مصرح بالتعديل" });
    }
    //check if req.body is not empty object
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ msg: "لا يوجد بيانات للتحديث" });
    }

    const { error } = await validateUpdateProduct(req.body, product.category);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    res.status(200).json({ msg: "تم تحديث المنتج بنجاح", updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "خطأ في تحديث المنتج" });
  }
});

// Delete product (owner or admin)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "المنتج غير موجود" });

    const user = await UserModel.findById(req.user.id);
    if (product.owner.toString() !== req.user.id && user.role !== "admin") {
      return res.status(403).json({ msg: "غير مصرح بالحذف" });
    }

   // delete aws images form product.images[] 
   if (product.images) {
      
      product.images.forEach(async (image) => {
        const params = { Bucket: process.env.AWS_S3_BUCKET, Key: image };
        await s3.deleteObject(params).promise();
      });
    }
    await product.deleteOne();
    res.json({ msg: "تم حذف المنتج بنجاح" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "خطأ في حذف المنتج", error: error });
  }
});

// Report a product
router.post("/:id/report", verifyToken, async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "المنتج غير موجود" });

    product.reports.push({
      user: req.user.id,
      reason: req.body.reason || "",
    });

    await product.save();
    res.json({ msg: "تم الإبلاغ عن المنتج" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "خطأ في الإبلاغ" });
  }
});

module.exports = router;

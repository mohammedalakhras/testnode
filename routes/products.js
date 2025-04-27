const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/token/verifyToken.js");
const { ProductModel, validateProduct } = require("../models/Product.js");
const { UserModel } = require("../models/User.js");

// إنشاء منتج جديد (يحتاج موافقة الإدارة)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { error } = validateProduct(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const seller = await UserModel.findById(req.user.id);
    if (!seller || seller.state !== "active") {
      return res.status(403).json({ message: "الحساب غير نشط أو غير موجود" });
    }

    const product = new ProductModel({
      ...req.body,
      seller: req.user.id,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "خطأ في إنشاء المنتج" });
  }
});

// الحصول على جميع المنتجات (مع الفلترة)
router.get("/", async (req, res) => {
  try {
    const { category, city, status, search } = req.query;
    const filter = { isApproved: true, isActive: true };

    if (category) filter.category = category;
    if (city) filter.city = city;
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: "i" };

    const products = await ProductModel.find(filter)
      .populate("seller", "username photo rate")
      .populate("city", "name")
      .sort("-createdAt");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "خطأ في جلب المنتجات" });
  }
});

// تحديث المنتج (الخاص بالبائع أو المشرف)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    const user = await UserModel.findById(req.user.id);
    if (product.seller.toString() !== req.user.id && user.role !== "admin") {
      return res.status(403).json({ message: "غير مصرح بالتعديل" });
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "خطأ في تحديث المنتج" });
  }
});

// حذف المنتج (الخاص بالبائع أو المشرف)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    const user = await UserModel.findById(req.user.id);
    if (product.seller.toString() !== req.user.id && user.role !== "admin") {
      return res.status(403).json({ message: "غير مصرح بالحذف" });
    }

    await ProductModel.findByIdAndDelete(req.params.id);
    res.json({ message: "تم حذف المنتج" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في حذف المنتج" });
  }
});

// الإبلاغ عن منتج
router.post("/:id/report", verifyToken, async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    product.reports.push({
      user: req.user.id,
      reason: req.body.reason,
    });

    await product.save();
    res.json({ message: "تم الإبلاغ عن المنتج" });
  } catch (error) {
    res.status(500).json({ message: "خطأ في الإبلاغ" });
  }
});

module.exports = router;
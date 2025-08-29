const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/token/verifyToken.js");
const { fillRole } = require("../middlewares/admin/fillRole.js");
const { ProductModel } = require("../models/Product.js");
const {
  getUploadUrlProduct,
} = require("../controllers/auth/aws/products/getUploadUrlProduct.js");
const {
  getMediaUrls,
} = require("../controllers/auth/aws/products/getProductMediaUrls.js");

const { getProducts } = require("../controllers/product/getProducts.js");
const { updatedProduct } = require("../controllers/product/updateProduct.js");
const { deleteProduct } = require("../controllers/product/deleteProduct.js");
const { publishProduct } = require("../controllers/product/publishProduct.js");
const { getProductById } = require("../controllers/product/getProductById.js");
const { getSimilarProducts } = require("../controllers/product/getSimilarProducts.js");
const { getMaxPrices } = require("../controllers/product/getMaxPrices.js");
const { getFolloweesProducts } = require("../controllers/product/getProductsFromFollowings.js");
const { getMyProducts } = require("../controllers/product/getMyProducts.js");
const { getUserProducts } = require("../controllers/product/getUserProducts.js");

router.post("/uploadURL", verifyToken, getUploadUrlProduct);

// Create a new product (requires admin approval)
router.post("/", verifyToken, publishProduct);

// Fetch products with filters, pagination, and text search
router.get("/", getProducts);

router.get("/getSimilarProducts/:id", getSimilarProducts);
router.get("/maxPrices", getMaxPrices);
router.get("/userProducts/:userId", getUserProducts);

router.get("/followings", verifyToken, getFolloweesProducts);
router.get("/myProducts", verifyToken, getMyProducts);

router.get("/:id", getProductById);

// Update product (owner or admin)
router.put("/:id", verifyToken, updatedProduct);

// Delete product (owner or admin)
router.delete("/:id", verifyToken, fillRole, deleteProduct);

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

router.get("/images/products/:id", async (req, res) => {
  try {
    const urls = await getMediaUrls(req.params.id);

    res.status(200).json({ url: urls });
  } catch (err) {
    res.status(500).json({ msg: "Server Error", err });
  }
});
module.exports = router;

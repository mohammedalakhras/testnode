const { validateProduct, ProductModel } = require("../../models/Product.js");
const { UserModel } = require("../../models/User.js");

exports.publishProduct = async (req, res) => {
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
};

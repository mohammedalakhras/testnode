const { ProductModel, validateUpdateProduct } = require("../../models/Product.js");
const { UserModel } = require("../../models/User.js");



exports.updatedProduct=async (req, res) => {
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
}
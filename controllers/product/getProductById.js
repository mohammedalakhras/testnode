const { default: mongoose } = require("mongoose");
const { ProductModel } = require("../../models/Product.js");
const { getMediaUrls } = require("../auth/aws/products/getProductMediaUrls.js");


exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "معرّف المنتج غير صالح" });
    }

    // Fetch product and populate references
    const product = await ProductModel.findById(id)
      .populate("owner", "username photo rate")
      .populate("location.location", "name")
      .populate("category", "name")
      .lean();

    if (!product) {
      return res.status(404).json({ msg: "المنتج غير موجود" });
    }

    // Prepare keys for medium-quality images (without prefix)
    const medKeys = product.images.map(img => img.med.replace("products/", "")).filter(Boolean);

    // Generate signed URLs for each medium-quality image
    const medUrls = await getMediaUrls(medKeys);

    // Attach URLs to product
    const productWithMedImages = {
      ...product,
      images: medUrls,
    };

    return res.json({ data: productWithMedImages });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return res.status(500).json({ msg: "خطأ في جلب بيانات المنتج" });
  }
};

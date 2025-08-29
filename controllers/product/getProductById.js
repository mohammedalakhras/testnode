const { default: mongoose } = require("mongoose");
const { ProductModel } = require("../../models/Product.js");
const { getMediaUrls } = require("../auth/aws/products/getProductMediaUrls.js");
const {
  replaceUserKeysWithUrls,
} = require("../../services/replaceUsersKeysWithUrls.js");

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "معرّف المنتج غير صالح" });
    }

    // Fetch product and populate references
    const product = await ProductModel.findByIdAndUpdate(
      id,
      {
        $inc: { views: 1 },
      },
      { new: true }
    )
      .populate("owner", "username photo rate bio")
      // .populate("location.location", "name")
      .populate({
        path: "location.location",
        select: "name ancestors",
        populate: {
          path: "ancestors",
          select: "name",
        },
      })
      .populate("category", "name")
      .lean();

    if (!product) {
      return res.status(404).json({ msg: "المنتج غير موجود" });
    }

    // Prepare keys for medium-quality images (without prefix)
    const medKeys = product.images
      .map((img) => img.med.replace("products/", ""))
      .filter(Boolean);
    const vidmedKeys = product.videos
      .map((vid) => vid.replace("products/", ""))
      .filter(Boolean);

    // Generate signed URLs for each medium-quality image
    const medUrls = await getMediaUrls(medKeys);
    const vidmedUrls = await getMediaUrls(vidmedKeys);

    if (product.owner?.photo) {
      product.owner.photo = await replaceUserKeysWithUrls(product.owner.photo);
    }
    // Attach URLs to product
    const productWithMedImages = {
      ...product,
      images: medUrls,
      videos: vidmedUrls,
    };

    return res.json({ data: productWithMedImages });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return res.status(500).json({ msg: "خطأ في جلب بيانات المنتج" });
  }
};

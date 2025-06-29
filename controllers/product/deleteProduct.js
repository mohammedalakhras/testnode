const { ProductModel } = require("../../models/Product.js");
const { UserModel } = require("../../models/User.js");
const s3 = require("../../src/config/aws.js");


exports.deleteProduct=async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "المنتج غير موجود" });

    // const user = await UserModel.findById(req.user.id);
    if (product.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "غير مصرح بالحذف" });
    }

    // delete aws images form product.images[]
    const objectsToDelete = [];

    for (const image of product.images) {
      if (image.low) objectsToDelete.push({ Key: image.low });
      if (image.med) objectsToDelete.push({ Key: image.med });
      if (image.high) objectsToDelete.push({ Key: image.high });
    }

    for (const vidKey of product.videos) {
      objectsToDelete.push({ Key: vidKey });
    }

    if (objectsToDelete.length > 0) {
    const del=  await s3
        .deleteObjects({
          Bucket: process.env.AWS_S3_BUCKET,
          Delete: { Objects: objectsToDelete, Quiet: false },
        })
        .promise();
       
    }

    await product.deleteOne();
    res.json({ msg: "تم حذف المنتج بنجاح" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "خطأ في حذف المنتج", error: error });
  }
}
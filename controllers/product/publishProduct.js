const { Follow } = require("../../models/Follow.js");
const { validateProduct, ProductModel } = require("../../models/Product.js");
const { UserModel } = require("../../models/User.js");
const { createAndSendNotification } = require("../../services/notificationService.js");

exports.publishProduct = async (req, res) => {
  try {
    const { error } = await validateProduct(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    console.log("product");
    const seller = await UserModel.findById(req.user.id).lean();
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
        market: seller.verifiedStatus == "Normal" ? false : true,
      });

      await product.save();

      try {
        const followers = await Follow.find({ followee: req.user.id })
          .select("follower -_id")
          .lean();

        if (followers.length > 0) {
          const followerIds = followers.map((f) => f.follower);

          const payload = {
            title: "منتج جديد من أحد البائعين الذين تتابعهم",
            body: `قام ${seller.username} بنشر منتج جديد:\n ${product.title}`,
            data: {
              productId: product._id,
              type: "new_product",
            },
          };

          await createAndSendNotification(followerIds, payload);
        }
      } catch (notifError) {
        console.error("Error sending notifications:", notifError);
      }
      res.status(201).json({ msg: "تم إضافة المنتج بنجاح", product });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "خطأ في إضافة المنتج", error: error });
  }
};

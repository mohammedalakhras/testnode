// controllers/product/getMaxPrices.js
const { ProductModel } = require("../../models/Product.js");

exports.getMaxPrices = async (req, res) => {
  try {
    const now = new Date();

    const result = await ProductModel.aggregate([
      { $match: { expiresAt: { $gt: now } } },
      {
        $group: {
          _id: "$price.currency",
          maxAmount: { $max: "$price.amount" },
        },
      },
    ]);
    console.log(result);

    // نهيئ الناتج لتضمين كلتا العملتين
    const response = {
      SYP: 0,
      USD: 0,
    };
    result.forEach((r) => {
      if (r._id === "SYP") response.SYP = r.maxAmount;
      if (r._id === "USD") response.USD = r.maxAmount;
    });

    res.json({
      data: response,
      msg: "أعلى الأسعار حسب العملة",
    });
  } catch (error) {
    console.error("Error fetching max prices:", error);
    res.status(500).json({ msg: "خطأ في جلب أعلى الأسعار" });
  }
};

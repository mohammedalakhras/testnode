// controllers/users/getUserById.js
const { UserModel } = require("../../models/User.js");
const { ProductModel } = require("../../models/Product.js");
const { Follow } = require("../../models/Follow.js");
const { default: mongoose } = require("mongoose");

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        msg: "رقم المستخدم غير صالح",
      });
    }
    const user = await UserModel.findById(id)
      .select(
        "-password -verificationCode -verificationCodeExpires -favourites -authProvider -activated -numberOfAlerts -state -role -numberOfReports -blockedUsers -updatedAt -fcmTokens"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "المستخدم غير موجود",
      });
    }
    if (user.phoneVisible == false) {
      delete user.phone;
    }
    if(!user.bio){
        user.bio=null;
    }

    const productsCount = await ProductModel.countDocuments({
      owner: id,
      //   status: "Approved",
      //   isSold: false,
      expiresAt: { $gt: new Date() },
    });
      // عدد المتابعين (followers)
    const followersCount = await Follow.countDocuments({ followee: id });

    // عدد الذين يتابعهم (followings)
    const followingsCount = await Follow.countDocuments({ follower: id });

    res.status(200).json({
      data: {
        ...user,
        productsCount,
        followers:followersCount,
        following:followingsCount
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

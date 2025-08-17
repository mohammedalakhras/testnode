const { UserModel } = require("../../models/User.js");
const { ProductModel } = require("../../models/Product.js");
const { Follow } = require("../../models/Follow.js");
const {
  replaceUserKeysWithUrls,
} = require("../../services/replaceUsersKeysWithUrls.js");

exports.me = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id)
      .select("-password -verificationCode -verificationCodeExpires")
      .lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    if (user.photo) user.photo = await replaceUserKeysWithUrls(user.photo);
    if (user.cover) user.cover = await replaceUserKeysWithUrls(user.cover);

    user.blockedUsers = user.blockedUsers.length;

    if (!user.bio) {
      user.bio = null;
    }
    const productsCount = await ProductModel.countDocuments({
      owner: req.user.id,
      // status: "Approved",
      // isSold: false,
      expiresAt: { $gt: new Date() },
    });

    const followersCount = await Follow.countDocuments({ followee: req.user.id });

    // عدد الذين يتابعهم (followings)
    const followingsCount = await Follow.countDocuments({ follower: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        ...user,
        productsCount,
        followers: followersCount,
        following: followingsCount,
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

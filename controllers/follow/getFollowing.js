const { Follow } = require("../../models/Follow.js");
const mongoose = require("mongoose");

//get list followed by user
exports.getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const skip = page * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const following = await Follow.find({ follower: userId })
      .populate("followee", "username fullName photo")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select("followee -_id")
      .lean();

    const normalizedFollowings = following.map((e) => e.followee);
    const total = await Follow.countDocuments({ follower: userId });

    res.status(200).json({
      totalFollowings: total,
      pageNumber: page,
      NumberOfPages: Math.ceil(total / limit),
      normalizedFollowings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error",error });
  }
};

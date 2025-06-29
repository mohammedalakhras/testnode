const { Follow } = require("../../models/Follow.js");
const mongoose = require("mongoose");

//get who follow the user
exports.getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const skip = page * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const followers = await Follow.find({ followee: userId })
      .populate("follower", "username fullName photo")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select("follower -_id")
      .lean();
      
    const total = await Follow.countDocuments({ followee: userId });
    const normalizedFollowers=followers.map(e=>e.follower)

    res.status(200).json({
      totalFollowers: total,
      pageNumber: page,
      NumberOfPages: Math.ceil(total / limit),
      normalizedFollowers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error",error });
  }
};

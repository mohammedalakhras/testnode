const { Follow } = require("../../models/Follow.js");
const mongoose = require("mongoose");

exports.unfollowUser = async (req, res) => {
  try {
    const { follower, followee } = req.body;

    if (req.user.id != follower) {
      return res.status(403).json({
        msg: "Unauthorized process.\nUser can unfollow accounts that followed by his account.",
      });
    }
    if (
      !mongoose.Types.ObjectId.isValid(follower) ||
      !mongoose.Types.ObjectId.isValid(followee)
    ) {
      return res.status(400).json({ error: "Invalid user id(s)" });
    }

    const result = await Follow.deleteOne({ follower, followee });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Follow relationship not found" });
    }

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error", error });
  }
};

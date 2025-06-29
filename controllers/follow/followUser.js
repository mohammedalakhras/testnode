const { Follow, followValidationSchema } = require("../../models/Follow.js");
const { UserModel } = require("../../models/User.js");

exports.followUser = async (req, res) => {
  try {

    
    const { follower, followee } = req.body;


    if(req.user.id!=follower){
      return res.status(403).json({ error: "Unauthorized to do this following Process" });
    }

    
    if (follower == followee) {
      return res.status(400).json({ error: "Users Can't Follow Themthelfs." });
    }

    const { error } = followValidationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const [followerUser, followeeUser] = await Promise.all([
      UserModel.findById(follower),
      UserModel.findById(followee),
    ]);

    if (!followerUser || !followeeUser) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    const existingFollow = await Follow.findOne({ follower, followee });
    if (existingFollow) {
      return res.status(400).json({ error: "Already following this user" });
    }

    const follow = new Follow({ follower, followee });
    await follow.save();

    res.status(201).json(follow);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error",error });
  }
};

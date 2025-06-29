const express = require("express");
const { followUser } = require("../controllers/follow/followUser");
const { unfollowUser } = require("../controllers/follow/unfollowUser");
const { getFollowers } = require("../controllers/follow/getFollowers");
const { getFollowing } = require("../controllers/follow/getFollowing");
const { verifyToken } = require("../middlewares/token/verifyToken");
const router = express.Router();

router.post("/",verifyToken, followUser);

router.get("/followers/:userId", getFollowers);

router.get("/following/:userId", getFollowing);

router.delete("/",verifyToken, unfollowUser);



module.exports = router;

const express = require("express");
const { followUser } = require("../controllers/follow/followUser");
const { unfollowUser } = require("../controllers/follow/unfollowUser");
const { getFollowers } = require("../controllers/follow/getFollowers");
const { getFollowing } = require("../controllers/follow/getFollowing");

//middlewares
const { verifyToken } = require("../middlewares/token/verifyToken");

const {fillUsername}=require('../middlewares/admin/fillUsername.js')
const router = express.Router();

router.post("/",verifyToken,fillUsername, followUser);

router.get("/followers/:userId", getFollowers);

router.get("/following/:userId", getFollowing);

router.delete("/",verifyToken, unfollowUser);



module.exports = router;

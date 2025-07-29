const express = require("express");
const {verifyToken}=require('../middlewares/token/verifyToken.js')
const {
  getNotifications,
  markRead,
} = require("../controllers/notifications/notifications.js");

const router = express.Router();

router.get("/", verifyToken, getNotifications);

router.patch("/:notifId/read", verifyToken, markRead);

module.exports = router;

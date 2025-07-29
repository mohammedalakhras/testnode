// ملف routes/ratings.js
const express = require("express");
const router = express.Router();

const { addRating } = require("../controllers/user/ratings/addRating.js");
const { deleteRating } = require("../controllers/user/ratings/deleteRating.js");
const { editRating } = require("../controllers/user/ratings/editRating.js");
const { getRatings } = require("../controllers/user/ratings/getRatings.js");
const {
  getReplies,
} = require("../controllers/user/ratings/replies/getReplies.js");

//middlewares
const {
  verifyNotBlocked,
} = require("../middlewares/token/verifyNotBlocked.js");

const { fillRole } = require("../middlewares/admin/fillRole.js");
const { addReply } = require("../controllers/user/ratings/replies/addReply.js");
const {
  editReply,
} = require("../controllers/user/ratings/replies/editReply.js");
const {
  deleteReply,
} = require("../controllers/user/ratings/replies/deleteReply.js");
// إضافة تقييم لمستخدم
router.post("/users/:userId/ratings", verifyNotBlocked, addRating);

// تعديل تقييم
router.put("/ratings/:ratingId", verifyNotBlocked, editRating);

// حذف تقييم
router.delete("/ratings/:ratingId", verifyNotBlocked, fillRole, deleteRating);

// جلب تقييمات مستخدم مع pagination
router.get("/users/:userId/ratings", getRatings);

//replies
router.get("/replies/:ratingId/replies", getReplies);

router.post("/replies/:ratingId/replies", verifyNotBlocked, addReply);

router.put("/replies/:ratingId/replies/:replyId", verifyNotBlocked, editReply);

router.delete(
  "/replies/:ratingId/replies/:replyId",
  verifyNotBlocked,
  fillRole,
  deleteReply
);

module.exports = router;

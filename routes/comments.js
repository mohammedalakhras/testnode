const express = require("express");
const router = express.Router();

const addComment = require("../controllers/comment/addComment.js");
const deleteComment = require("../controllers/comment/deleteComments.js");
const getCommentsByProduct = require("../controllers/comment/getCommentsByProduct.js");
const getRepliesByComment = require("../controllers/comment/getRepliesByComment.js");
const addReplyToComment = require("../controllers/comment/addReplyToComment.js");
const deleteReply = require("../controllers/comment/deleteReply.js");

//middlewares
const { verifyToken } = require("../middlewares/token/verifyToken.js");
const {
  verifyNotBlocked,
} = require("../middlewares/token/verifyNotBlocked.js");
const {
  checkTokenExists,
} = require("../middlewares/token/checkTokenExists.js");
const { fillRole } = require("../middlewares/admin/fillRole.js");
const { fillUsername } = require("../middlewares/admin/fillUsername.js");

router.delete("/replies/", verifyToken, fillRole,deleteReply);
//comments
router.post("/", verifyNotBlocked, addComment);
router.delete("/:commentId", verifyToken,fillRole, deleteComment);
router.get("/", checkTokenExists, fillRole, getCommentsByProduct);

//replies
router.get("/:commentId/replies", getRepliesByComment);
router.post("/replies", verifyNotBlocked,fillUsername, addReplyToComment);

module.exports = router;

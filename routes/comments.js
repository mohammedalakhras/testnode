const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment.js");
const { verifyToken } = require("../middlewares/token/verifyToken.js");




async function addReplyToComment(commentId, userId, content) {
    try {
      // Find the comment by ID
      const comment = await CommentModel.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Create a new reply object
      const newReply = {
        content,
        user: userId,
        createdAt: new Date()
      };
      
      // Add the reply to the comment's replies array
      comment.replies.push(newReply);
      
      // Save the updated comment
      await comment.save();
      
      // Return the updated comment
      return comment;
    } catch (error) {
      throw error;
    }
  }

router.post("/", verifyToken, async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.id; 
      
      const updatedComment = await addReplyToComment(commentId, userId, content);
      
      res.status(201).json({
        success: true,
        data: updatedComment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });





module.exports = router;


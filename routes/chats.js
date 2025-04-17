const express = require("express");
const { verifyToken } = require("../middlewares/verifyToken.js");
const mongoose = require("mongoose");

const { MessageModel } = require("../models/Message.js");

const router = express.Router();

/**
 * @description get all my chats(with last message) ordered by date
 * @route /api/chats/MyChats
 * @method GET
 * @access private
 */
router.get("/MyChats", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const messagesAggregate = await MessageModel.aggregate([
      {
        $match: {
          $or: [{ receiver: userObjectId }, { sender: userObjectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $addFields: {
          chatPartner: {
            $cond: {
              if: { $eq: ["$sender", userObjectId] },
              then: "$receiver",
              else: "$sender",
            },
          },
        },
      },
      {
        $group: {
          _id: "$chatPartner",
          messageCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userObjectId] },
                    { $in: ["$status", ["sent", "delivered"]] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          lastMessage: { $first: "$content" },
          lastMessageDate: { $first: "$createdAt" },
          lastMessageId: { $first: "$_id" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partner",
        },
      },
      {
        $unwind: "$partner",
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          messageId: "$lastMessageId",
          fullName: {
            $cond: {
              if: { $eq: ["$_id", userObjectId] },
              then: "Saved Messages",
              else: "$partner.fullName",
            },
          },
          photo: "$partner.photo",
          cover: "$partner.cover",
          lastLoginTime:"$partner.lastLoginTime",
          messageCount: {
            $cond: {
              if: { $eq: ["$_id", userObjectId] },
              then: 0,
              else: "$messageCount"
            }
          },
          lastMessage: 1,
          
          lastMessageDate: 1,
        },
      },
      {
        $sort: { lastMessageDate: -1 },
      },
    ]);

    return res.json(messagesAggregate);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({
      message: "Error fetching chats",
      error: error.message,
    });
  }
});

/**
 * @description get messages with specefic user ordered by date
 * @route /api/chats/getMessages/:id
 * @method GET
 * @access private
 */

router.get("/getMessages/:id", verifyToken, async (req, res) => {
  try {
    const chatPartnerId = req.params.id;
    const myId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatPartnerId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const messages = await MessageModel.find({
      $or: [
        { sender: myId, receiver: chatPartnerId },
        { sender: chatPartnerId, receiver: myId }
      ]
    })
    .sort({ createdAt: 1 }) // Sort by timestamp ascending
    .select('-__v') // Exclude version key
    .lean();

    return res.json(messages);

  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

module.exports = router;

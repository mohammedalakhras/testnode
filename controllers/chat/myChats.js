const mongoose = require("mongoose");
const { MessageModel } = require("../../models/Message.js");
const { flushSpecificMessages } = require("../../src/lib/queues/queue.js");

exports.myChats = async (req, res) => {
  try {
    const { page = 0 } = req.params.pageID;
    const limit = 10;
    const skip = Number(page) * Number(limit);

    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    await flushSpecificMessages(userId);
    const messagesAggregate = await MessageModel.aggregate([
      {
        $match: {
          $or: [{ receiver: userObjectId }, { sender: userObjectId }],
        },
      },
      {
        $sort: { sentAt: -1, createdAt: -1 },
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
          lastMessageDate: { $first: "$sentAt" },
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
          lastLoginTime: "$partner.lastLoginTime",
          messageCount: {
            $cond: {
              if: { $eq: ["$_id", userObjectId] },
              then: 0,
              else: "$messageCount",
            },
          },
          lastMessage: 1,

          lastMessageDate: 1,
        },
      },
      {
        $sort: { lastMessageDate: -1 },
      },
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    return res.json(messagesAggregate);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({
      msg: "Error fetching chats",
      error: error.message,
    });
  }
};

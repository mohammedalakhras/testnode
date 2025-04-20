const jwt = require("jsonwebtoken");
const { UserModel } = require("../../models/User.js");
const { MessageModel } = require("../../models/Message.js");
const { default: mongoose } = require("mongoose");

const startSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRETE_KEY);
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }
      socket.userId = user._id;
      socket.username = user.username;
      socket.userData = {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        lastLoginTime: user.lastLoginTime,
      };

      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected (Socket ID: ${socket.id})`);

    socket.join(socket.userId.toString());

    //new
    socket.on("registerFCM", async (token) => {
      await UserModel.findByIdAndUpdate(socket.userId, {
        $addToSet: { fcmTokens: token },
      });
    });

    socket.on("logout", async (token) => {
      await UserModel.findByIdAndUpdate(socket.userId, {
        $pull: { fcmTokens: token },
      });
    });

    //end new

    socket.on("signin", async () => {
      console.log(`User ${socket.userData.fullName} signed in`);

      await UserModel.findByIdAndUpdate(socket.userId, {
        $set: {
          lastLoginTime: "active",
        },
      });
      socket.userData.lastLoginTime = "active";
      socket.broadcast.emit("lastSeenUpdate", {
        partnerId: socket.userId.toString(),
        lastSeen: "active",
      });

      try {
        const pendingMessages = await MessageModel.find({
          receiver: socket.userId,
          status: "sent",
        });

        for (const msg of pendingMessages) {
          await MessageModel.findByIdAndUpdate(msg._id, {
            status: "delivered",
          });
          io.to(msg.sender.toString()).emit("changeMessageStatus", {
            id: msg._id,
            status: "delivered",
          });
        }
      } catch (error) {
        console.error("Error updating pending messages to delivered:", error);
      }
    });

    socket.on("sendMessage", async (data) => {
      console.log("data", data);

      const messageWithSender = {
        content: data.content,
        receiver: new mongoose.Types.ObjectId(data.receiver),
        sender: socket.userData,
        fullName: socket.userData.fullName,
        createdAt: new Date(),
        status: "sent",
      };

      const message = new MessageModel({
        sender: messageWithSender.sender._id,
        receiver: messageWithSender.receiver,
        content: messageWithSender.content,
      });
      const savedMsg = await message.save();
      messageWithSender._id = savedMsg._id;

   
      const receiverData = await UserModel.findById(
        messageWithSender.receiver,
        "photo fullName lastLoginTime"
      );

      const updatedConversation = {
        chatPartner: messageWithSender.receiver,
        fullName:
          messageWithSender.sender._id.toString() !==
          messageWithSender.receiver.toString()
            ? receiverData.fullName
            : "Saved Messages",
        lastMessage: messageWithSender.content,
        lastMessageDate: messageWithSender.createdAt,
        photo: receiverData.photo ? receiverData.photo : null,
        lastLoginTime: receiverData.lastLoginTime,
      };

      io.to(messageWithSender.sender._id.toString()).emit(
        "updatedMessage",
        updatedConversation
      );

      io.to(messageWithSender.sender._id.toString()).emit(
        "LoadNewMessage",
        messageWithSender
      );
      io.to(messageWithSender.receiver.toString()).emit("receive", {
        ...messageWithSender,
        lastLoginTime: socket.userData.lastLoginTime,
      });

      // التحقق مما إذا كان المستلم متصلاً (بوجوده في غرفته)
      const receiverRoom = io.sockets.adapter.rooms.get(
        messageWithSender.receiver.toString()
      );
      if (receiverRoom && receiverRoom.size > 0) {
        await MessageModel.findByIdAndUpdate(savedMsg._id, {
          status: "delivered",
        });
        io.to(messageWithSender.sender._id.toString()).emit(
          "changeMessageStatus",
          {
            id: savedMsg._id,
            status: "delivered",
          }
        );
      }
    });

    socket.on("messageDelivered", async (message) => {
      await MessageModel.findByIdAndUpdate(message._id, {
        status: "delivered",
      });
      io.to(message.sender._id.toString()).emit("changeMessageStatus", {
        id: message._id,
        status: "delivered",
      });
    });

    socket.on("messageRead", async (message) => {
      const res = await MessageModel.findByIdAndUpdate(message._id, {
        status: "read",
      });

      io.to(message.sender._id.toString()).emit("changeMessageStatus", {
        id: message._id,
        status: "read",
      });
    });

    socket.on("disconnect", async () => {
      const room = io.sockets.adapter.rooms.get(socket.userId.toString());

      if (!room || room.size === 0) {
        const lastSeen = new Date().toUTCString();
        await UserModel.findByIdAndUpdate(socket.userId, {
          $set: {
            lastLoginTime: lastSeen,
          },
        });

        socket.broadcast.emit("lastSeenUpdate", {
          partnerId: socket.userId.toString(),
          lastSeen: lastSeen,
        });
        console.log(socket.id, "has disconnected");
      }
    });
  });
};

module.exports = { startSocket };

const jwt = require("jsonwebtoken");
const { UserModel } = require("../../models/User.js");
const { MessageModel } = require("../../models/Message.js");
const { default: mongoose } = require("mongoose");
const { sendNotification } = require("./notificationService.js");
const { getSignedUrl } = require("../../controllers/chat/getMessgaesById.js");
const {
  enqueueNotification,
  writeQueue,
  scheduleFlush,
} = require("./queues/queue.js");

const startSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.token;
      console.log("token", socket.handshake.auth, socket.handshake.headers);
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
    // socket.on("registerFCM", async (token) => {
    //   await UserModel.findByIdAndUpdate(socket.userId, {
    //     $addToSet: { fcmTokens: token },
    //   });
    // });

    // socket.on("logout", async (token) => {
    //   await UserModel.findByIdAndUpdate(socket.userId, {
    //     $pull: { fcmTokens: token },
    //   });
    // });

    //end new

    socket.on("signin", async () => {
      const start = Date.now();
      console.log(`User ${socket.userData.fullName} signed in`);

      // تحديث حالة lastLoginTime للمستخدم
      await UserModel.findByIdAndUpdate(socket.userId, {
        $set: { lastLoginTime: "active" },
      });
      socket.userData.lastLoginTime = "active";
      socket.broadcast.emit("lastSeenUpdate", {
        partnerId: socket.userId.toString(),
        lastSeen: "active",
      });

      try {
        // 1. جلب الرسائل المعلقة مرةً واحدة
        const pending = await MessageModel.find(
          { receiver: socket.userId, status: "sent" },
          { _id: 1, sender: 1 }
        );

        if (pending.length > 0) {
          // 2. تجهيز مصفوفة عمليات التحديث
          const ops = pending.map((msg) => ({
            updateOne: {
              filter: { _id: msg._id },
              update: { $set: { status: "delivered" } },
            },
          }));

          // 3. تنفيذ جميع عمليات التحديث دفعة واحدة
          await MessageModel.bulkWrite(ops, { ordered: false });
          // :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

          // 4. إرسال إشعارات لجميع المرسلين
          pending.forEach((msg) => {
            io.to(msg.sender.toString()).emit("changeMessageStatus", {
              id: msg._id,
              status: "delivered",
            });
          });
        }

        console.log("signin took", Date.now() - start, "ms");
      } catch (error) {
        console.error("Error updating pending messages to delivered:", error);
      }
    });

    socket.on("sendMessage", async (data) => {
      const time = new Date().getMilliseconds();
      const messageWithSender = {
        content: data.content,
        receiver: new mongoose.Types.ObjectId(data.receiver),
        sender: socket.userData,
        fullName: socket.userData.fullName,
        sentAt: new Date(),
        status: "sent",
      };

      const message = new MessageModel({
        sender: messageWithSender.sender._id,
        receiver: messageWithSender.receiver,
        content: messageWithSender.content,
        media: data.media,
        sentAt: messageWithSender.sentAt,
      });
      // console.log("message", message);
      writeQueue.push(message);
      scheduleFlush();

      if (data.media) {
        messageWithSender.media = data.media;
        messageWithSender.media.url = await getSignedUrl(data.media.url);
      }
      // const savedMsg = await message.save();
      messageWithSender._id = message._id;

      const receiverData = await UserModel.findById(
        messageWithSender.receiver,
        "photo fullName lastLoginTime fcmTokens"
      ).lean();

      try {
        // sendNotification(receiverData.fcmTokens, {
        //   title: `رسالة جديدة من ${socket.userData.fullName}`,
        //   body: message.content,
        //   data: { k1: "v1" },
        // });
        const payload = {
          title: `رسالة جديدة من 
                ${socket.userData.fullName}
               `,
          body:
            `${message.media.type ? message.media.type : "رسالة نصية"}
            ${data.content}
                ` || "",
          data: { type: "message", senderId: socket.userId.toString() },
        };
        enqueueNotification(receiverData.fcmTokens, payload);
      } catch (err) {
        console.error("FCM Error:", err);
      }
      const updatedConversation = {
        chatPartner: messageWithSender.receiver,
        fullName:
          messageWithSender.sender._id.toString() !==
          messageWithSender.receiver.toString()
            ? receiverData.fullName
            : "Saved Messages",
        lastMessage: messageWithSender.content,
        lastMessageDate: messageWithSender.sentAt,
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
        await MessageModel.findByIdAndUpdate(message._id, {
          status: "delivered",
        });
        io.to(messageWithSender.sender._id.toString()).emit(
          "changeMessageStatus",
          {
            id: message._id,
            status: "delivered",
          }
        );
      }
      console.log("time", new Date().getMilliseconds() - time);
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

    // socket.on("messageRead", async (message) => {
    //   const res = await MessageModel.findByIdAndUpdate(message._id, {
    //     status: "read",
    //   });

    //   io.to(message.sender._id.toString()).emit("changeMessageStatus", {
    //     id: message._id,
    //     status: "read",
    //   });
    // });

    socket.on("messageDelivered", async (message) => {
      const queuedMsgIndex = writeQueue.findIndex(
        (msg) => msg._id.toString() === message._id
      );

      if (queuedMsgIndex !== -1) {
        writeQueue[queuedMsgIndex].status = "delivered";
      } else {
        await MessageModel.findByIdAndUpdate(message._id, {
          status: "delivered",
        });
      }

      io.to(message.sender._id.toString()).emit("changeMessageStatus", {
        id: message._id,
        status: "delivered",
      });
    });

    socket.on("messageRead", async (message) => {
      const queuedMsgIndex = writeQueue.findIndex(
        (msg) => msg._id.toString() === message._id
      );

      if (queuedMsgIndex !== -1) {
        writeQueue[queuedMsgIndex].status = "read";
      } else {
        await MessageModel.findByIdAndUpdate(message._id, {
          status: "read",
        });
      }

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

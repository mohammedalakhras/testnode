const { default: mongoose } = require("mongoose");
const { MessageModel } = require("../../models/Message.js");
const s3 = require("../../src/config/aws.js");
const { flushSpecificMessages } = require("../../src/lib/queues/queue.js");
exports.getMessagesById = async (req, res) => {
  try {
    const chatPartnerId = req.params.id;
    const skips = parseInt(req.params.skips || 0);
    const myId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(chatPartnerId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    await flushSpecificMessages(myId);

    // الحصول على أحدث الرسائل أولاً
    const messages = await MessageModel.find({
      $or: [
        { sender: myId, receiver: chatPartnerId },
        { sender: chatPartnerId, receiver: myId },
      ],
    })
      .sort({ createdAt: -1 }) // ترتيب تنازلي للحصول على أحدث الرسائل
      .skip(skips * 20)
      .limit(20)
      .select("-__v") // استبعاد المفتاح __v
      .lean();

    // عكس الترتيب لجعل الرسائل تصاعدية عند العرض
    messages.reverse();

    const messagesWithMedia = await Promise.all(
      messages.map(async (msg) => {
        if (msg.media) {
          msg.media.key = msg.media.url;

          msg.media.url = await getSignedUrl(msg.media.url);
        }
        return msg;
      })
    );

    return res.json(messagesWithMedia);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

async function getSignedUrl(url) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: url,
    Expires: 3000, // صلاحية 5 دقائق
  };
  return s3.getSignedUrlPromise("getObject", params);
}
exports.getSignedUrl = getSignedUrl;

// exports.getMessagesById=  async (req, res) => {
//   try {
//     const chatPartnerId = req.params.id;
//     const skips=parseInt(req.params.skips);
//     const myId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(chatPartnerId)) {
//       return res.status(400).json({ message: "Invalid user ID format" });
//     }

//     const messages = await MessageModel.find({
//       $or: [
//         { sender: myId, receiver: chatPartnerId },
//         { sender: chatPartnerId, receiver: myId }
//       ]
//     })
//     .sort({ createdAt: -1 })
//     .skip(0) //pagination
//     .limit(10)
//     .sort({ createdAt: 1 }) // Sort by timestamp ascending
//     .select('-__v') // Exclude version key
//     .lean();

//     return res.json(messages);

//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message
//     });
//   }
// }

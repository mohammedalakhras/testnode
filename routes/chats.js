const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/token/verifyToken.js");
const { myChats } = require("../controllers/chat/myChats.js");
const { getMessagesById } = require("../controllers/chat/getMessgaesById.js");
const { getUploadUrlChat } = require("../controllers/auth/aws/chats/getChatMediaUploader.js");
const { chatMediaDownloader } = require("../controllers/auth/aws/chats/getChatMediaDownloader.js");

/**
 * @description get all my chats(with last message) ordered by date
 * @route /api/chats/MyChats
 * @method GET
 * @access private
 */
router.get("/MyChats/:pageID", verifyToken, myChats);

/**
 * @description get messages with specefic user ordered by date.
 *              :id is user id
 *              :skips is for pagination messgaes(default is 0 to get last 20 messages)
 *                  ex:if we have messgaes form 1 to 40 
 *                  skips=0  => we will get messages from 1->20
 *                  skips=1  => we will get messgaes from 21->40
 * @route /api/chats/getMessages/:id/:skips
 * @method GET
 * @access private
 */

router.get("/getMessages/:id/:skips", verifyToken, getMessagesById);


router.post(
    "/uploadURL",
    verifyToken,
    getUploadUrlChat
  );

  router.get(
    "/:key",
    verifyToken,
    chatMediaDownloader
  );
  
module.exports = router;

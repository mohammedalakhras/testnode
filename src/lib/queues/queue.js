const { MessageModel } = require("../../../models/Message.js");
const { sendNotification } = require("../../lib/notificationService.js");

// —————— In-memory queues ——————
const writeQueue = [];
let writeTimer = null;

function scheduleFlush() {
  console.log("scheduleFlush", writeQueue.length,'\n',writeQueue);
  // Flush immediately when we hit 20 messages
  if (writeQueue.length >= 20) {
    flushWrites();
  }
  // Otherwise set a 30s timer (only once)
  else if (!writeTimer) {
    writeTimer = setTimeout(flushWrites, 10 * 10000);
  }
}

async function flushWrites() {
  clearTimeout(writeTimer);
  writeTimer = null;

  if (writeQueue.length === 0) return;

  // Grab and clear the batch
  const batch = writeQueue.splice(0, writeQueue.length);

  try {
    // Bulk insert all queued MessageModel docs
    await MessageModel.bulkWrite(
      batch.map((doc) => ({
        insertOne: { document: doc.toObject() },
      })),
      { ordered: false }
    );
  } catch (err) {
    console.error("Bulk write error:", err);
  }
}

// —————— Notification queue ——————
const notificationQueue = [];
function enqueueNotification(tokens, payload) {
  notificationQueue.push({ tokens, payload });
  // flush immediately; could also batch similarly if needed
  flushNotifications();
}

async function flushNotifications() {
  while (notificationQueue.length) {
    const { tokens, payload } = notificationQueue.shift();
    try {
      await sendNotification(tokens, payload);
    } catch (err) {
      console.error("FCM Error:", err);
    }
  }
}

// Add to src/lib/queues/queue.js
async function flushSpecificMessages(userId) {
  console.log("flushSpecificMessages", userId);
  if (writeQueue.length === 0) return;

  // Find messages that involve this user
  const userMessages = writeQueue.filter(
    (msg) =>
      msg.sender.toString() === userId.toString() ||
      msg.receiver.toString() === userId.toString()
  );

  if (userMessages.length === 0) return;

  // Remove these messages from the queue
  userMessages.forEach((msg) => {
    const index = writeQueue.indexOf(msg);
    if (index !== -1) {
      writeQueue.splice(index, 1);
    }
  });

  // Save them to DB immediately
  try {
    await MessageModel.bulkWrite(
      userMessages.map((doc) => ({
        insertOne: { document: doc.toObject() },
      })),
      { ordered: false }
    );
  } catch (err) {
    console.error("Specific messages bulk write error:", err);
  }
}

module.exports = {
  flushNotifications,
  enqueueNotification,
  scheduleFlush,
  flushWrites,
  writeQueue,
  scheduleFlush,
  flushSpecificMessages,
};

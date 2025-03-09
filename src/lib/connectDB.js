const mongoose = require("mongoose");
const config = require("./config");

const connectToDB = async () => {
  try {
    await mongoose.connect(config.DB_URI);
    console.log("Connected to the database successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

module.exports = { connectToDB };

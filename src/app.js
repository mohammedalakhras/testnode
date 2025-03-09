const express = require("express");
const { connectToDB } = require("./lib/connectDB");
const { startServer } = require("./lib/server");
const logger = require("../middlewares/logger.js");

const app = express();

// Middlewares
app.use(express.json());
app.use(logger);

// Routes
app.use("/api/users", require("../routes/auth.js"));

connectToDB();
startServer(app);

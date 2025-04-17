const express = require("express");
const { connectToDB } = require("./lib/connectDB");
const { startServer } = require("./lib/server");
const { startSocket } = require("./lib/socket.js");
const logger = require("../middlewares/logger.js");
const cors = require("cors");

const http = require("http");

const app = express();

const server = http.createServer(app);

// Middlewares
app.use(express.json());
app.use(cors());
app.use(logger);

//socket.io

startSocket(server);

// Routes
app.use("/api/users", require("../routes/auth.js"));
app.use("/api/chats", require("../routes/chats.js"));
connectToDB();
startServer(server);

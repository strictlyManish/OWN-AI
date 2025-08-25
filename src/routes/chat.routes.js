const express = require("express");
const chat = express.Router();
const chatController = require("../controllers/chat.controller");
const authMiddleware = require("../middlewares/auth.middleware");


chat.post("/chat",authMiddleware,chatController);



module.exports = chat;
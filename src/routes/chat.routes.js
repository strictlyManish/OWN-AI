const express = require("express");
const chat = express.Router();
const { chatController, getChats, getMessages } = require("../controllers/chat.controller"); // ✅ destructure
const authMiddleware = require("../middlewares/auth.middleware");

// Create chat
chat.post("/chat", authMiddleware, chatController);

// Get all chats
chat.get("/", authMiddleware, getChats);

// Get messages of a chat
chat.get("/messages/:id", authMiddleware, getMessages);

module.exports = chat;

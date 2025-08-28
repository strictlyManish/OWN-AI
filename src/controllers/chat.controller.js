const chatModel = require("../models/chat.model");
const messageModel = require("../models/message.model"); // ✅ missing import

// Create new chat
async function chatController(req, res) {
  try {
    const user = req.user;
    const { chat_title } = req.body;

    if (!chat_title) {
      return res.status(400).json({ message: "Chat title is required" });
    }

    const chat = await chatModel.create({
      user: user._id,
      title: chat_title,
    });

    return res.status(201).json({
      message: "Chat created successfully",
      chat: {
        _id: chat._id,
        title: chat.title,
        user: chat.user,
        lastActivity: chat.lastActivity,
      },
    });
  } catch (err) {
    console.error("Error creating chat:", err);
    res.status(500).json({ message: "Server error while creating chat" });
  }
}

// Get all chats of logged-in user
async function getChats(req, res) {
  try {
    const user = req.user;

    const chats = await chatModel.find({ user: user._id }).sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Chats retrieved successfully",
      chats: chats.map((chat) => ({
        _id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        user: chat.user,
      })),
    });
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ message: "Server error while fetching chats" });
  }
}

// Get all messages of a chat
async function getMessages(req, res) {
  try {
    const { id: chatId } = req.params;

    const messages = await messageModel
      .find({ chat: chatId })
      .sort({ createdAt: 1 });

    res.status(200).json({
      message: "Messages retrieved successfully",
      messages,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server error while fetching messages" });
  }
}

module.exports = { chatController, getChats, getMessages };

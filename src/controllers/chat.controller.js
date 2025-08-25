const chatModel = require("../models/chat.model");


async function  chatController(req,res) {
    const user = req.user
    const {chat_title} = req.body;

    const chat = await chatModel.create({
        user:user._id,
        title:chat_title
    });

    return res.status(201).json({
        message:"chat created",
        chatID:chat._id
    });
};

module.exports = chatController;
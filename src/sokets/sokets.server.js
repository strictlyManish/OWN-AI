const { Server } = require("socket.io");
const cookie = require("cookie");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const messageModel = require("../models/message.model");

const { genrateResponse, genrateEmmbeding } = require("../services/ai.service");
const { createVectorMemory, queryVectorMemory } = require("../services/vector.service");
const { text } = require("express");


async function initializeSokets(httpServer) {

    const io = new Server(httpServer, { /* options */ });

    io.use(async (socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

        if (!cookies.token) {
            next(new Error("Authentication error: No token provided"));
        }

        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            socket.user = user
            next()

        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        };

    });

    io.on("connection", (socket) => {
        try {
            socket.on("ai-message", async (payload) => {
                if (!payload) {
                    return
                };

                const message = await messageModel.create({
                    user: socket.user._id,
                    chat: payload.chatId,
                    content: payload.title,
                    role: "user"
                });


                const vectors = await genrateEmmbeding(payload.title);

                const vectorMemory = await queryVectorMemory({
                    queryvector: vectors,
                    limit: 1,
                    metadata: {}
                });

                await createVectorMemory({
                    vectors,
                    messageId: message._id,
                    metadata: {
                        user: socket.user._id,
                        chat: payload.chatId,
                        text: payload.title
                    }
                });

                const chatHistory = (await messageModel
                    .find({ chat: payload.chatId })
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .lean())
                    .reverse();

                const response = await genrateResponse(chatHistory.map((item) => {
                    return {
                        role: item.role,
                        parts: [{ text: item.content }]
                    }
                }));

                const response_message = await messageModel.create({
                    user: socket.user._id,
                    chat: payload.chatId,
                    content: response,
                    role: "model"
                });

                const responsevectors = await genrateEmmbeding(response);

                await createVectorMemory({
                    vectors: responsevectors,
                    messageId: response_message._id,
                    metadata: {
                        user: socket.user._id,
                        chat: payload.chatId,
                        text: response
                    }
                });

                socket.emit("ai-response", {
                    title: payload.title,
                    response
                });
            });
        } catch (error) {
            console.log('internet conection required')
        }

    });
};

module.exports = initializeSokets;
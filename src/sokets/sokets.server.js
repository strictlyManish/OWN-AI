const { Server } = require("socket.io");
const cookie = require("cookie");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const genrateResponse = require("../services/ai.service");
const messageModel = require("../models/message.model");


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
                    return 'payload required'
                };

                await messageModel.create({
                    user: socket.user._id,
                    chat: payload.chatId,
                    content: payload.title,
                    role: "user"
                });

                const response = await genrateResponse(payload.title)

                await messageModel.create({
                    user: socket.user._id,
                    chat: payload.chatId,
                    content: response,
                    role: "model"
                });

                socket.emit("ai-response", {
                    response
                });
            });
        } catch (error) {
            console.log('internet conection required')
        }

    });
};

module.exports = initializeSokets;
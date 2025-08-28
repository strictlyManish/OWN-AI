const { Server } = require("socket.io");
const cookie = require("cookie");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const messageModel = require("../models/message.model");
const { genrateResponse, genrateEmmbeding } = require("../services/ai.service");
const { createVectorMemory, queryVectorMemory } = require("../services/vector.service");


async function initializeSokets(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            allowedHeaders: [ "Content-Type", "Authorization" ],
            credentials: true
        }
    });

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
                    return;
                }

                const [message, vectors] = await Promise.all([
                    messageModel.create({
                        user: socket.user._id,
                        chat: payload.chatId,
                        content: payload.title,
                        role: "user"
                    }),
                    genrateEmmbeding(payload.title)
                ]);

                // createVectorMemory needs to run after `vectors` is resolved
                await createVectorMemory({
                    vectors,
                    messageId: message._id,
                    metadata: {
                        user: socket.user._id,
                        chat: payload.chatId,
                        text: payload.title
                    }
                });

                const [vectorMemory, chatHistory] = await Promise.all([
                    queryVectorMemory({
                        queryvector: vectors,
                        limit: 1,
                        metadata: { user: socket.user._id }
                    }),
                    messageModel
                        .find({ chat: payload.chatId })
                        .sort({ createdAt: -1 })
                        .limit(10)
                        .lean()
                        .then(results => results.reverse())
                ]);

                const sort_term = chatHistory.map((item) => ({
                    role: item.role,
                    parts: [{ text: item.content }]
                }));

                const long_term = [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `These are some previous messages for the chat. Use them to generate a response:\n${Array.isArray(vectorMemory)
                                        ? vectorMemory
                                            .map(item => item?.metadata?.text ?? "")
                                            .filter(Boolean)
                                            .join("\n")
                                        : ""
                                    }`
                            }
                        ]
                    }
                ];

                const response = await genrateResponse([...long_term, ...sort_term]);

                socket.emit("ai-response", {
                    title: payload.title,
                    response
                });

                const [response_message, responsevectors] = await Promise.all([
                    messageModel.create({
                        user: socket.user._id,
                        chat: payload.chatId,
                        content: response,
                        role: "model"
                    }),
                    genrateEmmbeding(response)
                ]);

                await createVectorMemory({
                    vectors: responsevectors,
                    messageId: response_message._id,
                    metadata: {
                        user: socket.user._id,
                        chat: payload.chatId,
                        text: response
                    }
                });
            });
        } catch (error) {
            return 'internet connection required'
        }

    });
};

module.exports = initializeSokets;
const express = require("express");
const app = express();
const cookie_parser = require("cookie-parser");
const auth = require("../src/routes/authentication.route");
const chat = require("../src/routes/chat.routes");



// Middlewares here--
app.use(express.json());
app.use(cookie_parser());



// routes ---
app.use("/api",auth)
app.use("/api",chat)




module.exports = app;
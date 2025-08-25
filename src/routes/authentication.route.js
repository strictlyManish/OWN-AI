const express = require("express");
const auth = express.Router();
const {registerController,loginController} = require("../controllers/auth.controller");



auth.post("/register",registerController)
auth.post("/login",loginController)




module.exports = auth;
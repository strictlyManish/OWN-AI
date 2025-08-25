const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

async function authMiddleware(req, res, next) {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(409).json({
                message: "Unauthrized"
            });
        };

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        if (!decode) {
            return res.status(409).json({
                message: "Unauthrized"
            });
        }
        const user = await userModel.findOne({ id: decode._id });
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({
            message: "something went wrong."
        })
    }
};


module.exports = authMiddleware;
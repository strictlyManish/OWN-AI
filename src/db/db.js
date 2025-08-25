const mongoose = require("mongoose");

const conect_database = () =>{
    try {
        mongoose.connect(process.env.MONGODB_URI);
        console.log('Database Contected 🚀')
    } catch (error) {
        console.log(error)
    }
};

module.exports = conect_database;
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const MarksSchema = mongoose.Schema({
    username: {
        type: String,
        require: true
    },
    marks: {
        type: String,
        require: true
    }
});



module.exports = mongoose.model("Marks", MarksSchema);
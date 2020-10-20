const mongoose = require("mongoose");


const LevelSchema = mongoose.Schema({
    level_id: {
        type: String,
        require: true
    },
    subject_id: {
        type: String,
        require: true
    }
});

module.exports = mongoose.model("Level", LevelSchema);
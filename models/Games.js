const mongoose = require("mongoose");


const GamesSchema = mongoose.Schema({
    game_id: {
        type: String,
        require: true
    },
    game_name: {
        type: String,
        require: true
    },
    level_id: {
        type: String,
        require: true
    },
    subject_id: {
        type: String,
        require: true
    }

});

module.exports = mongoose.model("Games", GamesSchema);
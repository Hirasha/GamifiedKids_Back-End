const mongoose = require("mongoose");


const SubjectSchema = mongoose.Schema({
    sub_id: {
        type: String,
        require: true
    },
    sub_name: {
        type: String,
        require: true
    }
});

module.exports = mongoose.model("Subjects", SubjectSchema);
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const UserSchema = mongoose.Schema({
    username: { type: String, require: true },

    studentname: { type: String, require: true },

    password: { type: String, required: true },

    faceId: { type: String, required: true },

    grade: { type: String, required: true },

    image: { type: String },

    totalMarks: { type: Number },

    completed_games: {
        type: [{
            game_id: { type: String },
            marks: { type: Number },
            time_spent: { type: String },
            emotions: {
                type: Array
            }
        }]
    },
    
});

UserSchema.statics.hashPassword = function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

UserSchema.methods.isValid = function (hashedpassword) {
    return bcrypt.compareSync(hashedpassword, this.password);
}

module.exports = mongoose.model("Users", UserSchema);
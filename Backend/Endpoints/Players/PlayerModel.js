var mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const PlayerSchema = new mongoose.Schema({
    userID: { type: String, unique: true, required: true },
    currentPoints: { type: Number, default: 0 },
    currentRights: { type: Number, default: 0 },
    currentWrongs: { type: Number, default: 0 },
    allTimeRights: { type: Number, default: 0 },
    allTimeWrongs: { type: Number, default: 0 },
    highestPoints: { type: Number, default: 0 },
    password: { type: String, required: true },
    isHost: { type: Boolean, default: false },
    loggedIn: {type: Boolean, default: false},
    isReady: {type: Boolean, default: false}, 
    tsName: {type: String, default: ""}
},
    { timestamps: true }
);
PlayerSchema.pre("save", function (next) {
    var user = this;
    console.log("Pre-save: " + this.password + " change: " + this.isModified("password"));
    if (!user.isModified("password"))
        return next();
    bcrypt.hash(user.password, 10).then((hashedPassword) => {
        user.password = hashedPassword;
        next();
    })
}, function (err) {
    next(err);
});

PlayerSchema.methods.comparePassword = function (candidatePassowrd, next) {
    bcrypt.compare(candidatePassowrd, this.password, function (err, isMatch) {
        if (err)
            return next(err);
        else
            next(null, isMatch)
    })
}
const Player = mongoose.model("Player", PlayerSchema);

module.exports = Player;
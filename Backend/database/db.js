var mongoose = require("mongoose");
const User = require("../Endpoints/Players/PlayerModel");
const config = require("config");

let _db;
const connectionString = config.get("db.connectionString");

function initDB(callback) {
    if (_db) {
        if (callback) {
            return callback(null, _db);
        } else {
            return _db;
        }
    } else {
        mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
        _db = mongoose.connection;

        _db.on("error", console.error.bind(console, "connection error:"));
        _db.once("open", async function () {
            console.log("Connected to database " + connectionString + " in DB.js: " + _db);
            
            try {
                const users = await User.countDocuments();
                if (users === 0) {
                    console.log("Do not have admin account yet. Create it with default password");

                    // erstellt neuen Admin
                    var adminUser = new User({
                        userID: "admin",
                        password: "Quiz4Life",
                        isHost: true
                    });

                    await adminUser.save();
                    // console.log("admin wurde erstellt", adminUser);
                }

                callback(null, _db);
            } catch (error) {
                console.error("Fehler beim Zugriff auf die Datenbank:", error);
            }
        });
    }
}

module.exports = { initDB };

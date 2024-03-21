const Player = require("./PlayerModel")

async function getPlayers() {
    try {
        const players = await Player.find().exec();
        return players;
    } catch (err) {
        throw err;
    }
}
async function getPlayer(userID) {
    console.log("in getplayer")
    try {
        const player = await Player.findOne({ "userID": userID });
        return player;
    } catch (err) {
        throw err;
    }
}

async function postPlayer(body) {
    try {
        let player = new Player(body);
        await player.save();
        return player;
    }
    catch (err) {
        console.error("fehler bei Suche in postUser: " + err);
        throw err;
    }
}
async function updatePlayer(player, body) {
    try {
        Object.assign(player, body)
        await player.save()
    }
    catch (err) {
        console.error("fehler bei Suche in updateUser: " + err);
        throw err;
    }
}
async function updateAllPlayers(updateData) {
    try {
        // Alle Benutzer abrufen
        const players = await Player.find().exec();

        // Durch jeden Benutzer iterieren und aktualisieren
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            // Aktualisierungsdaten auf den Benutzer anwenden
            Object.assign(player, updateData);
            // Benutzer speichern
            await player.save();
        }

        console.log("Alle Benutzer erfolgreich aktualisiert.");
    } catch (err) {
        console.error("Fehler beim Aktualisieren aller Benutzer:", err);
        throw err;
    }
}
async function deletePlayer(player) {
    try {
        let result = Player.deleteOne(player);
        return result;
    }
    catch (err) {
        console.error("fehler bei Suche in deleteUser: " + err);
        throw err;
    }
}

async function findUserBy(userID, callback) {
    if (!userID) {
        callback("UserID is missing");
        return;
    } else {
        try {
            const player = await Player.findOne({ "userID": userID });

            if (!player) {
                    console.log('Could not find player for player ID ' + userID);
                    callback("Did not find player for userID: " + userID, null);
            } else {
                console.log(`Found userID: ${userID}`);
                callback(null, player);
            }
        } catch (err) {
            console.error("Error finding player: " + err);
            callback("Error finding player: " + err, null);
        }
    }
}

module.exports = {
    getPlayers, getPlayer, findUserBy, postPlayer, updatePlayer, deletePlayer, updateAllPlayers
}
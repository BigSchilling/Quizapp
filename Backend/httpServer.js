const express = require("express");
const bodyParser = require('body-parser');
const http = require('http'); // Änderung hier von https auf http
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const database = require("./database/db")
const playerRoutes = require("./Endpoints/Players/PlayerRoutes")
const playerService = require("./Endpoints/Players/PlayerService")
const PlayerModel = require("./Endpoints/Players/PlayerModel")
const fs = require('fs');
const authenticationRoutes = require("./Endpoints/authentication/AuthenticationRoute")
const cors = require('cors');
const app = express();
app.use("*", cors())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Expose-Headers", "Authorization"); // Füge den Authorization-Header hinzu
    next();
});
const port = 8080;

app.use(bodyParser.json());

// Sound part
// Function to convert file to Base64
function fileToBase64(filePath) {
    const file = fs.readFileSync(filePath);
    return file.toString('base64');
}

// Sound dateien
const buzzerSoundPath = './Endpoints/SoundFiles/buzzerSoundR.mp3';
const buzzerSound = fileToBase64(buzzerSoundPath);

const rightSoundPath = './Endpoints/SoundFiles/rightSound.mp3';
const rightSound = fileToBase64(rightSoundPath);

const falseSoundPath = './Endpoints/SoundFiles/falseSound.mp3';
const falseSound = fileToBase64(falseSoundPath);

const releaseSoundPath = './Endpoints/SoundFiles/releaseSound.mp3';
const releaseSound = fileToBase64(releaseSoundPath);



// Sound Part ende

// MongoDB-Verbindung
database.initDB(function (err, db) {
    if (db) {
        console.log("Anbindung von Datenbank erfolgreich")
    }
    else {
        console.log("Anbindung von Datenbank gescheitert")
    }
});
// app routen
app.use("/api/players", playerRoutes)
app.use("/api/authenticate", authenticationRoutes)
// WebSocket-Server
const server = http.createServer(app); // Änderung hier von https auf http
const io = socketIo(server, { cors: { origin: "*" } });
var buzzerPressed = false;
io.on('connection', (socket) => {
    console.log('Neue Verbindung:', socket.id);

    // sounds senden
    io.emit("sounds", {
        buzzerSound: buzzerSound,
        rightSound: rightSound,
        falseSound: falseSound,
        releaseSound: releaseSound
    })


    // Beispiel: Daten aus der MongoDB abrufen und an den Client senden
    socket.on("sendMessage", (message) => {
        io.emit("message", message)
        // console.log(message);
    });

    // Aktualisieren der stats
    socket.on("sendStats", (stats) => {

    })
    // wer hat den buzzer gedrückt? 
    socket.on("sendBuzzerPressed", (playerID) => {
        buzzerPressed = true;
        // const now = new Date()
        // const year = now.getFullYear();
        // const month = now.getMonth() + 1; // Monate sind 0-basiert
        // const day = now.getDate();
        // const hours = now.getHours();
        // const minutes = now.getMinutes();
        // const seconds = now.getSeconds();
        // const milliseconds = now.getMilliseconds();
        // console.log(playerID + " hat den buzzer um: ")
        // console.log("Jahr: " + year);
        // console.log("Monat: " + month);
        // console.log("Tag: " + day);
        // console.log("Stunde: " + hours);
        // console.log("Minute: " + minutes);
        // console.log("Sekunde: " + seconds);
        // console.log("Millisekunde: " + milliseconds);
        if (buzzerPressed) {
            console.log("buzzerPressed by " + playerID)
            io.emit("buzzerPressed", playerID)
        }
    })
    // showmaster seite button hinzufügen
    socket.on("sendBuzzerReleased", () => {
        buzzerPressed = false
        io.emit("buzzerReleased")
    })
    socket.on("sendBuzzerReleasedFree", () => {
        buzzerPressed = false
        io.emit("buzzerReleasedFree")
    })
    // alle ausloggen    
    socket.on('sendLogOutAll', async (body) => {
        try {
            const result = await playerService.updateAllPlayers(body)
            io.emit("logOutAll")
            sendUpdatePlayers(null)
        } catch (error) {
            console.error('Error on sendLogOutAll, couldnt update all :', error);
        }
    });
    // 
    socket.on('sendLogIn', async (body) => {
        console.log("body aus sendLogin: " + body)
        try {
            // body = JSON.stringify(body)
            // console.log("body aus sendLogin: " + body)
            const player = await playerService.getPlayer(body.userID)
            if (!body.isHost) {
                if (player) {
                    // console.log("found player " + player)
                    const result = await playerService.updatePlayer(player, { loggedIn: body.loggedIn })
                }
            }
            sendUpdatePlayers(null)
        } catch (error) {
            console.error('Error on sendLogIn, couldnt update login:', error);
        }
    });
    // punkte verändern -- maybe unterteilen in falsch und richtige antworten oder wert und setzen 
    socket.on('sendRightPoints', async (body) => {
        try {
            // punkte und current/ alltime rights erhöhen
            const player = await playerService.getPlayer(body.userID)
            const points = parseInt(player.currentPoints) + parseInt(body.rightPoints);
            // current
            const currentPoints = { currentPoints: points }
            const currentRights = parseInt(player.currentRights) + 1;
            const currentRightsAdded = { currentRights: currentRights }
            // alltime
            const allTimeRights = parseInt(player.allTimeRights) + 1;
            const allTimeRightsAdded = { allTimeRights: allTimeRights }

            if (player) {

                //highscore
                if (player.highestPoints < points) {
                    const highestPoints = { highestPoints: points }
                    const resultHP = await playerService.updatePlayer(player, highestPoints)
                }
                const resultCP = await playerService.updatePlayer(player, currentPoints)
                const resultCR = await playerService.updatePlayer(player, currentRightsAdded)
                const resultAR = await playerService.updatePlayer(player, allTimeRightsAdded)
                io.emit("RightPoints", body)
                sendUpdatePlayers(true)
            }
        } catch (error) {
            console.error('Error on sendRightPoints, couldnt update all :', error);
        }
    });
    // punkte von anderen erhöhen bei falscher antwort
    socket.on('sendWrongPoints', async (body) => {
        try {
            // current and alltime  Wrongs erhöhen
            const player = await playerService.getPlayer(body.userID)
            const currentWrongs = parseInt(player.currentWrongs) + 1;
            const currentWrongsAdded = { currentWrongs: currentWrongs }
            // alltime wrongs
            const allTimeWrongs = parseInt(player.allTimeWrongs) + 1;
            const allTimeWrongsAdded = { allTimeWrongs: allTimeWrongs }
            if (player) {
                const resultCW = await playerService.updatePlayer(player, currentWrongsAdded)
                const resultAW = await playerService.updatePlayer(player, allTimeWrongsAdded)
            }
            // alle spieler bekommen und punkte von allen anderen als dem der gebuzzert hat erhöhen
            const players = await playerService.getPlayers()
            const updatedPlayers = players.filter(r => r.loggedIn === true && r.userID !== body.userID);
            // Durchlaufen Sie jeden Spieler in der aktualisierten Liste
            for (const player of updatedPlayers) {
                const points = parseInt(player.currentPoints) + parseInt(body.wrongPoints);
                const currentPoints = { currentPoints: points };
                // Aktualisieren Sie die Punkte des Spielers in der Datenbank
                await playerService.updatePlayer(player, currentPoints);
                //highscore
                if (player.highestPoints < points) {
                    const highestPoints = { highestPoints: points }
                    const resultHP = await playerService.updatePlayer(player, highestPoints)
                }
            }
            io.emit("WrongPoints", body)
            sendUpdatePlayers(false)
        } catch (error) {
            console.error('Error on sendWrongPoints, couldnt update all :', error);
        }
    });
    // funktion immer aufrufen wenn punkte irgendwie geändert wie in sendRightPoints
    // sendet die eingeloggten spieler und erneuert die punkte anzeige
    const sendUpdatePlayers = async (answer) => { // boolean für ton mitschicken
        try {
            var players = await playerService.getPlayers();
            players = players.filter(r => r.loggedIn === true);
            var playerPoints = players.reduce((acc, player) => {
                if (player.loggedIn) {
                    console.log(player.userID + ": " + player.currentPoints + " p");
                    acc[player.userID] = parseInt(player.currentPoints);
                    return acc;
                }
            }, {});
            io.emit("UpdatePlayers", playerPoints, players, answer);
        } catch (error) {
            console.error('Error on sendUpdatePlayers, couldnt update all :', error);
        }
    };
    // New Session - reset points, current right wrongs to 0 
    socket.on('sendNewSession', async () => {
        try {
            const body = { currentPoints: 0, currentRights: 0, currentWrongs: 0 }
            const result = await playerService.updateAllPlayers(body)
            // io.emit("logOutAll")
            sendUpdatePlayers(null)
        } catch (error) {
            console.error('Error on sendLogOutAll, couldnt update all :', error);
        }
    });
    socket.on('sendChangePoints', async (body) => {
        try {
            // punkte und current/ alltime rights erhöhen
            const player = await playerService.getPlayer(body.userID)
            console.log(body.manuellPoints)
            const points = parseInt(player.currentPoints) + parseInt(body.manuellPoints);
            const currentPoints = { currentPoints: points }
            if (player) {
                //highscore
                if (player.highestPoints < points) {
                    const highestPoints = { highestPoints: points }
                    const resultHP = await playerService.updatePlayer(player, highestPoints)
                }
                const resultCP = await playerService.updatePlayer(player, currentPoints)
                sendUpdatePlayers(null)
            }
        } catch (error) {
            console.error('Error on sendChangePoints, couldnt update all :', error);
        }
    });
    socket.on('sendShowQuestion', async (body) => {
        try {
            io.emit("showQuestion", body)
        } catch (error) {
            console.error('Error on sendShowQuestion, couldnt update all :', error);
        }
    }
    );
    socket.on('sendStreamingQuestion', async (body) => {
        try {
            io.emit("streamingQuestion", body)
        } catch (error) {
            console.error('Error on sendStreamingQuestion, couldnt update all :', error);
        }
    }
    );
    socket.on('sendHideQuestion', async (body) => {
        try {
            io.emit("hideQuestion", body)
        } catch (error) {
            console.error('Error on sendHideQuestion, couldnt update all :', error);
        }
    }
    );
    // ready ereignis
    socket.on('sendReadyChange', async (body) => {
        try {
            const player = await playerService.getPlayer(body.userID)
            const updater = {isReady: body.isReady}
            await playerService.updatePlayer(player, updater)
            // io.emit("logOutAll")
            sendUpdatePlayers(null)
        } catch (error) {
            console.error('Error on sendLogOutAll, couldnt update all :', error);
        }
    });
    socket.on('getBuzzerEvents', async () => {
        try {
            // Annahme: Du hast ein Model namens BuzzerEvent definiert
            const BuzzerEvent = mongoose.model('BuzzerEvent', new mongoose.Schema({
                participant: String,
                timestamp: Date,
            }));

            const buzzerEvents = await BuzzerEvent.find().exec();
            io.emit('buzzerEvents', buzzerEvents);
        } catch (error) {
            console.error('Fehler beim Abrufen der Buzzer-Ereignisse:', error);
        }
    });
});

server.listen(port, () => { console.log("listening on" + port) });
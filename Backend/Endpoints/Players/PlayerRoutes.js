const express = require("express");
var router = express.Router();
var playerService = require("./PlayerService")
var config = require("config");
var jwt = require("jsonwebtoken");


//alle player ausgeben
router.get("/", isAuthenticated, async (req, res, next) => {
    const token = getTokenInfo(req);
    console.log(token + " token in playerroutes")
    var isHost = token.isHost;
    if (isHost) {
        try { // nur admin darf das
            const result = await playerService.getUsers();
            if (result) {
                var subset = []
                for (let i = 0; i < result.length; i++) {
                    var { id, userID, isHost } = result[i];
                    subset[i] = { id, userID, isHost };
                    // console.log(JSON.stringify(subset))
                }
                res.status(200).send(subset);
            }

            else
                res.status(404).json({
                    Error:
                        "Es konnte keine Route gefunden werden"
                })
        } catch (err) {
            console.error("Error in UserRoute.get: " + err);
        }
    }
    else {
        res.status(403).json({ error: " not authorized" })//evtl noch ändern vor abgabe
    }
});
router.post("/", isAuthenticated, async (req, res) => {
    let body = req.body;
    const token = getTokenInfo(req);
    var isHost = token.isHost;
    if (isHost) {
        let player = await playerService.getPlayer(body.userID)
        if (player)
            res.status(400).json({ error: "den player gibt es schon" })
        else if (!body.userID && !body.password) {
            res.status(401).json({ error: "überprüfe deine userID und dein password bitte nochmal" })
        }
        else {
            const result = await playerService.postPlayer(req.body);
            if (result) {
                var { id, userID, isHost } = result;
                subset = { id, userID, isHost };
                res.status(201).send(subset);
            }
            else {
                res.status(403).json({ error: "Es gibt kein result" });
            }
        }
    }
})

//update User
router.put("/:userID", isAuthenticated, async (req, res) => {
    let uid = req.params.userID;
    const token = getTokenInfo(req);
    var isHost = token.isHost;
    var userID = req.userID

    if (req.body.userID && req.body.userID !== uid) {
        return res.status(400).json({ error: 'userID darf nicht geändert werden.' });
    }
    else {
        if (isHost) {
            var player = await playerService.getPlayer(uid);
            if (!player) {
                res.status(404)
                    .json({
                        Error:
                            "Es konnte kein User mit der id: " + uid +
                            " gefunden werden"
                    })
            }
            else {
                let result = await playerService.updatePlayer(player, req.body);
                // console.log(result)

                result = await playerService.getPlayer(uid);
                var { id, userID, isHost } = result;
                subset = { id, userID, isHost };
                res.status(200).send(subset);
            }
        }
    }
}
)
// update alle user
router.put("/", isAuthenticated, async (req, res) => {
    let uid = req.params.userID;
    const token = getTokenInfo(req);
    var isHost = token.isHost;
    var userID = req.userID


    if (isHost) {
        result = await playerService.updateAllPlayers(req.body);
        if (result)
            res.status(200).send(result);
        else
            res.status(400).json({ error: "konnte nicht alle updaten" })
    }
}
)
router.delete("/:userID", isAuthenticated, async (req, res) => {
    let id = req.params.userID;
    let player = await playerService.getPlayer(id);
    const token = getTokenInfo(req);
    const isHost = token.isHost;
    if (isHost) {
        if (!player) {
            res.status(404).json({ error: "player gibts nicht mehr" })
        }
        else {
            await playerService.deleteUser(player);
            res.status(204).send("erfolgreich gelöscht");
        }
    }
})

// überprüft ob player Authenticated ist
function getTokenInfo(req) {
    let token = req.headers.authorization.split(" ")[1];
    const payload = token.split('.')[1];
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
    const payloadObject = JSON.parse(decodedPayload);
    return payloadObject;
}
function isAuthenticated(req, res, next) {
    if (typeof req.headers.authorization !== "undefined") {
        let token = req.headers.authorization.split(" ")[1];
        console.log("isAuthenticated function token:" + token)
        var privateKey = config.get("session.tokenKey");
        jwt.verify(token, privateKey, { algorithm: "HS256" }, (err, player) => {
            if (err) {
                res.status(401).json({ error: "not Authorized" })
                return;
            }
            req.isHost = player.isHost; // gibt isAdmin attribut in req weiter
            req.userID = player.userID;
            console.log(req.isHost)
            return next();
        });
    } else {
        res.status(401).json({ error: "token undefined" })
        return;
    }
}
module.exports = router;
var express = require("express");
var router = express.Router();

var authenticationService = require("./AuthenticationService");
const { Console } = require("winston/lib/winston/transports");

router.get("/", function (req, res, next) { 
    try {
        if (!req.headers.authorization ) { //|| req.headers.authorization.indexOf("Basic" === -1)
            res.setHeader("WWW-Authenticate", `Basic realm = "Secure Area"`)
            return res.status(401).json({ message: "Missing Authorization Header gib die Daten!!!!!!!!!!" });
        }
        const base64Credentials = req.headers.authorization.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
        const [username, password] = credentials.split(":");
 
        console.log("Want to create token")
        authenticationService.createSessionToken(username, password, function (err, token, player) {
            if (token) {
                console.log("token???")
                res.header("Authorization", "Bearer " + token)
                if (player) {
                    res.status(200).json({success: "Token created"
                    })
                }
                else {
                    console.log("player is null, even though a token has been created, Error: " + err)
                    res.status(404).json({error: "unable to find player but token created"})
                }
            }
            else {
                console.log("Token has not been created, Error " + err)
                res.status(401).json({error: "Failed to create Token" })
            }
        });
    }
    catch (err) {
        console.log("falsch im AuthenticationRoute")
    }
});

module.exports = router;
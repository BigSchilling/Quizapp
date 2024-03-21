var playerService = require('../Players/PlayerService');
var jwt = require("jsonwebtoken");
var config = require("config");
var logger = require("../../config/winston")


//accesscontrol ---- code aus folien/ videos 
// const AccessControl = require=("accesscontrol")
// const ac = new AccessControl();
// ac.grant("player") //wahrscheinlich admin alles und player nur bestimmte sachen
// .createOwn("video")
// .deleteOwn("video")
// .readAny("video")
// const permission = ac.can("player").createOwn("video")
// console.log(permission.granted) //true
// console.log(permission.attributes) //all attributes

//video wird denke ich durch userID oder so ausgetauscht um Zugriff zu gewähren auf lesen und
// schreiben von Attributen
// router.get("/videos/:title", function (req, res, next) {
//     const permission = ac.can(req.player.role).readAny("video")
//     if (permission.granted) {
//         Video.find(req.params.title, function (err, data) {
//             if (err || !data)
//                 return res.status(404).end()
//             res.json(permission.filter(data))
//         });
//     }else{
//         res.status(403).end();
//     }
// })

function createSessionToken(userID, password, callback) {
    logger.debug("AuthenticationService: create Token.");

    if (!userID || !password) {
        logger.error("Error: have no userID or password");
        callback("JSON-Body missing", null, null);
        return;
    }

    playerService.findUserBy(userID, function (error, player) {
        if (player) {
            logger.debug('Found player '+player.userID+' , check the password ' + player.password);
            player.comparePassword(password, function (err, isMatch) {
                if (err) {
                    logger.error("Password is invalid" );
                    callback(err, null);
                }
                else {
                    if (isMatch) {

                        logger.debug("Password is correct. Create token.")
                        var issuedAt = new Date().getTime();
                        var expirationTime = config.get('session.timeout');
                        var expiresAt = issuedAt + (expirationTime * 1000);
                        var privateKey = config.get('session.tokenKey');
                        console.log(player.isHost + " Service")
                        let token = jwt.sign({ "userID": player.userID, "isHost": player.isHost}, privateKey, { expiresIn: expiresAt, algorithm: 'HS256' });

                        logger.debug("Token created: " + token);
                        callback(null, token, player);

                    }
                    else {
                        logger.error("Password or userID is invalid")
                        callback(err, null)
                    }
                }
            })
        }
        else {
            logger.error("Session Service: Did not find player for player ID: " + userID);
            callback("Did not find player", null);
        }
    })

}

module.exports = {
    createSessionToken
}
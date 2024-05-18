import styles from "./Teams.module.css";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown, Button, Card, Text, Image } from "react-bootstrap";
import io from "socket.io-client";
import Navigation from "../Navigation";
import "../../layout/scrollbar.css";
import useTSRemoteApp from "../../TS5-RemoteAPI/index.ts";
import "../../layout/animatedBorder.css";
import "../../layout/background.css";
import "../../layout/background2.css";
import Webcam from "react-webcam";
import tom1 from "../../images/tom3.jpg";
import jan1 from "../../images/jan3.jpg";
import tim1 from "../../images/tim1.jpg";
import dana1 from "../../images/dana1.jpg";
import noPic1 from "../../images/noPic1.jpg";
import { ReactComponent as BackgroundSVG } from "../../images/background1.svg";
import { ReactComponent as BackgroundSVG2 } from "../../images/background2.svg";
import ReactPlayer from "react-player";
import { aktuellerMod } from "../StreamingPage.js";
import { soundGif } from "../StreamingPage.js";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { backgroundGif } from "./TeamModPage.jsx";
const server = process.env.REACT_APP_API_SERVER;
// sehen wer spricht - Teamspeak 5 plugin

const TeamPage = () => {
  const [socket, setSocket] = useState("");
  const isHost = useSelector((state) => state.loginPlayer.isHost);
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const [buzzerPressedBy, setBuzzerPressedBy] = useState("");
  const [allPoints, setAllPoints] = useState([]); // punkte von allen spieler
  const [sortedPoints, setSortedPoints] = useState([]); // punkte ohne chris
  const [choices, setChoices] = useState(["", "", ""]); // antwortmöglichkeiten
  const [playerMessages, setPlayerMessages] = useState({}); // Nachrichten für jeden Spieler
  const [editMode, setEditMode] = useState(false); // edit mode für karte
  const [frage, setFrage] = useState();
  const [fragenIndex, setFragenIndex] = useState(0);
  const [punkteA, setPunkteA] = useState(0);
  const [punkteB, setPunkteB] = useState(0);
  const [kategorie, setKategorie] = useState();
  const [assets, setAssets] = useState();
  const [assetIndex, setAssetIndex] = useState(0);
  // timer
  const [timerKey, setTimerKey] = useState(180);
  const [timerDuration, setTimerDuration] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);
  const [cardColors, setCardColors] = useState(
    Array(3).fill("secondary")
  );
  // reactplayer variables
  const [isPlaying, setIsPlaying] = useState(false);
  const videoPlayerRef = useRef(null);
  let choiceVar = useRef({});
  //  teamspeak shit
  const talkingNames = useRef([]);
  const [talkingMap2, setTalkingmap] = useState([]);
  var playerChris = useRef({});

  const { clientsInChannel } = useTSRemoteApp({
    remoteAppPort: 5899,
    logging: false,
    auth: {
      name: "Quizshow",
      version: "1.0.0.0",
      identifier: "kok",
      description: "nimmm an du hond",
    },
  });
  useEffect(() => {
    // console.log(clientsInChannel);
    let newTalkingNames = [...talkingNames.current];

    const talkers = [];
    clientsInChannel.forEach((client) => {
      if (!talkingNames.current.includes(client.properties.nickname))
        talkingNames.current.push(client.properties.nickname);

      if (client.talkStatus === 1) {
        talkers.push(client.properties.nickname);
      }
    });
    setTalkingmap(talkers);

    for (const client of clientsInChannel) {
      let nickname = client?.properties?.nickname;
      // fügt namen in array hinzu
      if (!newTalkingNames.includes(nickname)) {
        newTalkingNames.push(nickname);
      }
    }
    talkingNames.current = newTalkingNames;
  }, [clientsInChannel]);

  // webcam---------------
  const [deviceId, setDeviceId] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const handleDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    setVideoDevices(videoDevices);
    // setDeviceId to default video device ID
    // setDeviceId(videoDevices[0]?.deviceId);
  };
  // console.log(videoDevices);
  // Funktion zum Festlegen der virtuellen Kamera von OBS
  useEffect(() => {
    const obsVirtualCamera = videoDevices.find((device) =>
      device.label.toLowerCase().includes("obs")
    );
    const streamlabsObsVirtualCamera = videoDevices.find((device) =>
      device.label.toLowerCase().includes("obs")
    );
    if (obsVirtualCamera) {
      console.log("Virtuelle Kamera von OBS gefunden:", obsVirtualCamera);
      setDeviceId(obsVirtualCamera.deviceId);
    } else {
      console.log("Virtuelle Kamera von OBS nicht gefunden.");
    }
  }, [videoDevices]);

  // Fetch video devices when component mounts
  useEffect(() => {
    handleDevices();
  }, []);

  const playStoredSound = (soundFile) => {};

  useEffect(() => {
    const newSocket = io(`ws://${server}:8080`, {});

    newSocket.on("connect", () => {
      console.log("WebSocket-Verbindung hergestellt");
      newSocket.emit("sendLogIn", { isHost: isHost });
    });
    // sound setzen
    // Hier kannst du auf eingehende Nachrichten reagieren
    newSocket.on("message", (message) => {
      const { userID, inputMessage } = message;

      // Aktualisiere die Nachrichten für den entsprechenden Benutzer
      setPlayerMessages((prevMessages) => ({
        ...prevMessages,
        [userID]: inputMessage,
      }));
    });
    // Buzzer wurde von jemand anderem gedrückt
    newSocket.on("buzzerPressed", (playerID) => {
      setBuzzerPressed(true);
      setBuzzerPressedBy(playerID);
      playStoredSound("buzzerSound");
    });
    //  buzzer wurde wieder freigegeben
    newSocket.on("buzzerReleased", () => {
      setBuzzerPressed(false);
      setBuzzerPressedBy(null);
    });
    // buzzer ohne punkte freigegeben
    newSocket.on("buzzerReleasedFree", () => {
      setBuzzerPressed(false);
      setBuzzerPressedBy(null);
      playStoredSound("releaseSound");
    });

    //  punkte werden verändert
    newSocket.on("pointsChanged", (points) => {
      setAllPoints(points);
      console.log(`punkte wurden verändert`);
    });
    // UpdatePlayers
    newSocket.on("UpdatePlayers", (playerPoints, players) => {
      setAllPoints(players);
    });

    // frage anzeigen
    newSocket.on("showQuestion", (body) => {
      // console.log("showQuestion", body.assetIndex, body.assets);
      setFrage(body.frage);
      setKategorie(body.kategorie);
      setFragenIndex(parseInt(body.fragenIndex));
      setAssets(body.assets);
      setAssetIndex(body.assetIndex);
      setChoices(body.choices);
    });
    newSocket.on("hideQuestion", (body) => {
      setFrage();
      setKategorie(body.kategorie);
      setFragenIndex(parseInt(body.fragenIndex));
      setAssets(body.assets);
      setChoices(body.choices);
    });
    newSocket.on("reactPlayerControls", (body) => {
      if ("isPlaying" in body) {
        console.log("server play ");
        handlePlayPause(body.isPlaying);
      }
      if (body.seekTime) {
        console.log("in body seekTime");
        handleSeekToTime(body.seekTime);
      }
    });
    newSocket.on("restartTimer", (body) => {
      setTimerDuration(body.timerDuration);
      setTimerKey((prevKey) => prevKey + 1);
    });
    newSocket.on("startTimer", (body) => {
      setTimerRunning(body.timeIsPlaying);
    });

    newSocket.on("choice", (body) => {
      setChoices(body.choices);
    });
    newSocket.on("teamPunkte", (body) => {
      if (body.team === "A") {
        setPunkteA(body.newValue);
      } else {
        setPunkteB(body.newValue);
      }
    });
    newSocket.on("cardColor", (body) => {
      let index = body.index;
      let color = body.color;
    
      // Verwenden Sie die Funktion, die den vorherigen Zustand als Argument verwendet
      setCardColors((prevColors) => {
        // Erstellen Sie eine Kopie des vorherigen Zustands
        let newColors = [...prevColors];
        // Aktualisieren Sie die Farbe der Karte
        newColors[index] = color;
        // Rückgabe des aktualisierten Zustands
        return newColors;
      });
    });
    
    setSocket(newSocket);

    return () => {
      // Schließe die WebSocket-Verbindung beim Komponentenabbau
      newSocket.disconnect();
    };
  }, [server]);

  const logoutAll = () => {
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendLogOutAll", { loggedIn: false });
    }
  };

  useEffect(() => {
    const sortedPoints = allPoints.filter(
      (player) => player.userID !== "Chris"
    );
    setSortedPoints(sortedPoints);

    playerChris.current = allPoints.find((item) => item.userID === "Chris");
    // console.log(playerChris.current, "playerChris.current");
  }, [allPoints]);
  // Funktion zum Aktivieren/Deaktivieren des Bearbeitungsmodus für eine Card
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Funktion zum Speichern der geänderten Daten und Senden an den WebSocket
  const saveChanges = (playerID, newData) => {
    if (socket) {
      socket.emit("savePlayerData", { userID: playerID, newData: newData });
    }
    toggleEditMode(); // Bearbeitungsmodus deaktivieren
  };

  // reactplayer functions
  const handlePlayPause = (data) => {
    console.log("handle play", data);
    setIsPlaying(data);
  };
  const handleSeekToTime = (totalSeconds) => {
    if (!isNaN(totalSeconds) && videoPlayerRef.current) {
      console.log("player seek gesetzt");
      videoPlayerRef.current.seekTo(totalSeconds);
    }
  };

  const camWidth = "20%";
  const camHeight = "10%";

  // console.log(talkingMap2, talkingNames.current);
  return (
    <div className={styles.container}>
      <div className={"backgroundContainer"}>
        <Image className={"backgroundImageClass"} src={backgroundGif} />
      </div>

      <div className={styles.Antworten}>
        <Card
          className={styles.Frage + " fragenText"}
          bg="secondary"
          border={"secondary"}
          style={{
            fontSize: "30px",
            borderRadius: "20px",
          }}
        >
          <Card.Body>
            <Card.Title className="grid-item2 " style={{ fontSize: "32px" }}>
              <h3>
                Frage {fragenIndex + 1}: {frage}
              </h3>
            </Card.Title>
          </Card.Body>
        </Card>
        {choices &&
          choices.map((choice, key) => (
            <Card
              className={`${styles["Antwort" + (key + 1)]}`}
              bg={cardColors[key]}
              border={"secondary"}
              style={{
                fontSize: "22px",
                marginTop: "3vh",
                borderRadius: "20px",
              }}
            >
              {" "}
              <Card.Body>
                <Card.Title
                  className="grid-item2 "
                  style={{ fontSize: "32px" }}
                >
                  <h3>{String.fromCharCode(65 + key)}: {choice}</h3>
                </Card.Title>
              </Card.Body>
            </Card>
          ))}
      </div>
      <div className={styles.Timer}>
        <CountdownCircleTimer
          // className={styles.timer}
          style={{ fontSize: "40px" }} // Schriftgröße hier festlegen
          key={timerKey}
          size={150}
          isPlaying={timerRunning}
          duration={timerDuration}
          colors={["#004777", "#7200d6", "#A30000", "#F7B801", "#A30000"]}
          colorsTime={[
            timerDuration,
            (timerDuration * 3) / 4,
            timerDuration / 2,
            timerDuration / 4,
            0,
          ]}
        >
          {({ remainingTime }) => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            return (
              <div style={{ fontSize: "60px" }}>
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </div>
            );
          }}
        </CountdownCircleTimer>
      </div>

      <div className={styles.Punkte}>
        <Card className={styles.PunkteA}>
          <Card.Title style={{ fontSize: "35px" }}>{punkteA} Punkte</Card.Title>
        </Card>

        <Card className={styles.PunkteB}>
          <Card.Title style={{ fontSize: "35px" }}>{punkteB} Punkte </Card.Title>
        </Card>
      </div>
      <div className={styles.Teams} id="grid-container">
        {sortedPoints.map((player, index) => (
          <div key={index} className={`${styles[player.userID]}`}>
            <Card
              bg="secondary"
              key={index}
              border={
                talkingMap2.includes(player.tsName)
                  ? "info"
                  : buzzerPressedBy === player.userID
                  ? "warning"
                  : player.isReady
                  ? "success"
                  : player.userID == aktuellerMod
                  ? "dark"
                  : "secondary"
              }
              style={{
                borderWidth: "4px",
                borderRadius: "20px",
                overflowY: "hidden",
                backgroundImage: `url(${
                  player.userID === "Tom"
                    ? tom1
                    : player.userID === "Tim"
                    ? tim1
                    : player.userID === "Jan"
                    ? jan1
                    : player.userID === "Dana"
                    ? dana1
                    : noPic1
                })`,
                backgroundSize: "cover",
                objectFit: "scale-down",
                backgroundPosition: "center center",
                width: "100%",
                height: "100%",
              }}
            >
              <Card.Body
                style={{
                  height: "100%",
                  paddingBottom: "10px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {player.userID === "Chris" ? (
                  <>
                    <Webcam
                      style={{ width: "auto", maxHeight: "240px" }}
                      audio={false}
                      videoConstraints={{
                        deviceId: deviceId ? { exact: deviceId } : undefined,
                      }}
                    />
                  </>
                ) : null}
                <Card.Body
                  style={{ fontSize: "30px" }}
                  className="d-flex justify-content-start align-items-end flex-wrap miniText"
                >
                  <div>{player.userID}</div>
                </Card.Body>
                {/* {player.userID === aktuellerMod ? null : (
                  <textarea
                    style={{
                      width: "100%",
                      resize: "none",
                      overflow: "hidden",
                      boxSizing: "border-box",
                      fontSize: "20px",
                      maxHeight: "30px",
                      backgroundColor: "rgba(255,255,255,0.95)",
                    }}
                    value={playerMessages[player.userID]}
                    readOnly
                  />
                )} */}
              </Card.Body>
            </Card>
          </div>
        ))}
        <div className={styles.chrisContainer} key={5}>
          <div className={styles.webcamContainer}>
            <Webcam
              style={{
                width: "100%",
                height: "100%",
                objectFit: "scale-down",
                borderRadius: "20px",
              }}
              audio={false}
              videoConstraints={{
                deviceId: deviceId ? { exact: deviceId } : undefined,
              }}
            />
          </div>
          {playerChris.current ? (
            <div
              className="overlay-card"
              style={{ backgroundColor: "rgba(0, 0, 0, 1)" }}
            >
              <Card
                className={`${styles.card} ${styles["no-filter"]}`}
                key={5}
                border={
                  talkingMap2.includes(playerChris.current.tsName)
                    ? "info"
                    : buzzerPressedBy === playerChris.current.userID
                    ? "warning"
                    : playerChris.current.isReady
                    ? "success"
                    : playerChris.current.userID == aktuellerMod
                    ? "primary"
                    : "secondary"
                }
                style={{
                  borderWidth: "5px",
                  borderRadius: "20px",
                  overflowY: "hidden",
                  minHeight: "100%", // Anpassen der Höhe nach Bedarf
                  minWidth: "100%",
                  position: "absolute",
                  top: "0%",
                  backgroundColor: "rgba(0,0,0,0)",
                }}
              >
                <Card.Body
                  style={{
                    height: "100%",
                    paddingBottom: "10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {/* {playerChris.current.userID != aktuellerMod ? (
                    <textarea
                      style={{
                        width: "100%",
                        overflow: "hidden",
                        resize: "none",
                        boxSizing: "border-box",
                        fontSize: "20px",
                        maxHeight: "30px",
                        backgroundColor: "rgba(255,255,255,0.95)",
                      }}
                      value={playerMessages[playerChris.current.userID]}
                      readOnly
                    />
                  ) : null} */}
                </Card.Body>
                <Card.Body
                  style={{ fontSize: "30px", bottom: "0%" }}
                  className="d-flex justify-content-between align-items-end flex-wrap miniText"
                >
                  <div className="text-with-outline miniText">
                    {playerChris.current.userID}
                  </div>
                </Card.Body>
              </Card>
            </div>
          ) : null}
        </div>
      </div>

      {/* <Navigation /> */}
    </div>
  );
};

export default TeamPage;

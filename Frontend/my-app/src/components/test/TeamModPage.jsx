import styles from "./TeamsMod.module.css";
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
import { setTeamPoints } from "../../slices/ShowMasterSlice";
import { ReactComponent as BackgroundSVG } from "../../images/background1.svg";
import { ReactComponent as BackgroundSVG2 } from "../../images/background2.svg";
import ReactPlayer from "react-player";
import { aktuellerMod } from "../StreamingPage.js";
import { soundGif } from "../StreamingPage.js";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import fragenData from "../../questionsCatalog/teams/folge1.json";
const server = process.env.REACT_APP_API_SERVER;
export const backgroundGif =
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmptd205MmdmbGxtbHU4ZXdxdng0YjRkdG9rZDJzd2RwNm9xNXpoZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ohhwNqFMnb7wZgNnq/giphy.gif";


const TeamModPage = () => {
  const dispatch = useDispatch();
  const [socket, setSocket] = useState("");
  const isHost = useSelector((state) => state.loginPlayer.isHost);
  const [allPoints, setAllPoints] = useState([]); // punkte von allen spieler
  const [sortedPoints, setSortedPoints] = useState([]); // punkte ohne chris
  const [playerMessages, setPlayerMessages] = useState({}); // Nachrichten für jeden Spieler
  const [editMode, setEditMode] = useState(false); // edit mode für karte
  const [frage, setFrage] = useState();
  const [fragenIndex, setFragenIndex] = useState(0);
  const [kategorie, setKategorie] = useState();
  const [assets, setAssets] = useState();
  const [assetIndex, setAssetIndex] = useState(0);
  // mod sachen
  const fragen = fragenData.fragen;
  const [showQuestion, setShowQuestion] = useState(false);
  let assetPointIndex = useRef(0);
  const teamPoints = useSelector((state) => state.showMaster.teamPoints);
  const [manuellPointsInput, setManuellPointsInput] = useState("");
  const [answerToggles, setAnswerToggles] = useState(
    new Array(fragen[fragenIndex].antworten.length).fill(false)
  );
  const [punkteA, setPunkteA] = useState(0);
  const [punkteB, setPunkteB] = useState(0);
  const [cardColors, setCardColors] = useState(
    Array(fragen[fragenIndex].choices.length).fill("secondary")
  );
  const setAnswerToggleButton = (index) => {
    setAnswerToggles((prevToggles) => {
      const newToggles = [...prevToggles];
      newToggles[index] = !newToggles[index];
      return newToggles;
    });
  };
  const changeFragenIndex = (value) => {
    const newValue = fragenIndex + value;
    if (newValue >= 0 && newValue < fragen.length) {
      resetShowQuestion(newValue);
      resetAnswerToggles();
      setFragenIndex(newValue);
      setAssetIndex(0);
      assetPointIndex.current = 0;
      dispatch(setTeamPoints({ teamPoints: 1 }));
      const frage = fragen[newValue].frage;
      const kategorie = fragen[newValue].kategorie;
      // const assets = fragen[newValue].assets;

      socket.emit("sendStreamingQuestion", {
        frage: frage,
        fragenIndex: newValue,
        kategorie: kategorie,
        // assets: assets,
        assetIndex: assetIndex,
      });
    }
  };
  const resetAnswerToggles = () => {
    setAnswerToggles(
      new Array(fragen[fragenIndex].antworten.length).fill(false)
    );
  };
  const changeShowQuestion = () => {
    setShowQuestion(true);
    if (socket) {
      const frage = fragen[fragenIndex].frage;
      const value = fragenIndex;
      const kategorie = fragen[value].kategorie;
      // const assets = fragen[value].assets;

      socket.emit("sendShowQuestion", {
        frage: frage,
        fragenIndex: value,
        kategorie: kategorie,
        // assets: assets,
        assetIndex: assetIndex,
      });
    }
  };
  const changeHideQuestion = () => {
    setShowQuestion(false);
    if (socket) {
      socket.emit("sendHideQuestion", {
        fragenIndex: fragenIndex,
        kategorie: fragen[fragenIndex].kategorie,
        choices: [],
      });
    }
  };
  const resetShowQuestion = (index) => {
    setShowQuestion(false);
    if (socket) {
      socket.emit("sendHideQuestion", {
        fragenIndex: index,
        kategorie: fragen[index].kategorie,
        // assets: " ",
      });
    }
  };
  const showChoice = (key) => {
    const choicesToSave = fragen[fragenIndex].choices.slice(0, key);
    if (socket) {
      socket.emit("sendChoice", {
        key: key,
        choices: choicesToSave,
      });
    }
  };
  //   timer
  const [timerKey, setTimerKey] = useState(180);
  const [timerDuration, setTimerDuration] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);
  // reactplayer variables
  const [isPlaying, setIsPlaying] = useState(false);
  const videoPlayerRef = useRef(null);
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
  //   console.log(videoDevices);
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

    //  punkte werden verändert
    newSocket.on("pointsChanged", (points) => {
      setAllPoints(points);
      console.log(`punkte wurden verändert`);
    });
    // UpdatePlayers
    newSocket.on("UpdatePlayers", (playerPoints, players) => {
      setAllPoints(players);
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
    newSocket.on("teamPunkte", (body) => {
      if (body.team === "A") {
        setPunkteA(body.newValue);
      } else {
        setPunkteB(body.newValue);
      }
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
    console.log(playerChris.current, "playerChris.current");
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
  const startTimer = () => {
    // Funktion, um den Timer zu starten oder zu stoppen
    if (socket) {
      // Sende die Nachricht an den Server, um den Timer zu starten oder zu stoppen
      socket.emit("sendStartTimer", {
        timeIsPlaying: true,
      });
    }
  };
  const stopTimer = () => {
    // Funktion, um den Timer zu starten oder zu stoppen
    if (socket) {
      // Sende die Nachricht an den Server, um den Timer zu starten oder zu stoppen
      socket.emit("sendStartTimer", {
        timeIsPlaying: false,
      });
    }
  };

  const restartTimer = () => {
    if (socket) {
      // Sende die Nachricht an den Server, um den Timer neu zu starten
      socket.emit("sendRestartTimer", {
        timerKey: timerDuration,
        timerDuration: timerDuration,
      });
    }
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
  const setPunkte = (team, value) => {
    let newValue;
    if (team === "A") {
      newValue = punkteA + teamPoints * value;
    } else {
      newValue = punkteB + teamPoints * value;
    }
    if (socket) {
      // Sende die Nachricht an den Server, um den Timer zu starten oder zu stoppen
      socket.emit("sendTeamPunkte", {
        team: team,
        newValue: newValue,
      });
    }
  };
  const changeColor = (index, event) => {
    // Verhindern des Standardverhaltens des Rechtsklicks
    event.preventDefault();
    // Wenn es sich um einen Rechtsklick handelt, ändern Sie die Farbe der Karte auf "danger"
    const newColors = [...cardColors];
    let color = "secondary"
    if (event.button === 2) {
      newColors[index] = "danger";
      color = "danger"
    } else {
      // Andernfalls ändern Sie die Farbe der Karte basierend auf dem aktuellen Zustand
      if (newColors[index] === "secondary") {
        newColors[index] = "warning";
        color="warning"
      } else if (newColors[index] === "warning") {
        newColors[index] = "success";
        color="success"
      } else {
        newColors[index] = "secondary";
        color="secondary"
      }
    }
    setCardColors(newColors);
    if (socket) {
      // Sende die Nachricht an den Server, um den Timer zu starten oder zu stoppen
      socket.emit("sendCardColor", {
        index: index,
        event: event.button,
        color: color
      });
    }
  };
  const camWidth = "20%";
  const camHeight = "10%";

  //   console.log(talkingMap2, talkingNames.current);
  return (
    <div className={styles.container}>
      <div className={"backgroundContainer"}>
        <Image className={"backgroundImageClass"} src={backgroundGif} />
      </div>

      <div className={styles.Antworten}>
        <Button
          variant="danger"
          className={styles.back}
          onClick={() => changeFragenIndex(-1)}
        >
          {" "}
          back
        </Button>
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
                Frage {fragenIndex + 1}: {fragen[fragenIndex].frage}
              </h3>
            </Card.Title>
          </Card.Body>
        </Card>
        <Button
          variant={showQuestion ? "dark" : "info"}
          className={styles.show}
          onClick={showQuestion ? changeHideQuestion : changeShowQuestion}
        >
          {!showQuestion ? "Frage anzeigen" : "Frage angezeigt"}
        </Button>
        <Button variant={"dark"} className={styles.right}>
          {fragen[fragenIndex].antworten[0]}
        </Button>
        <Button
          variant="info"
          className={styles.next}
          onClick={() => changeFragenIndex(1)}
        >
          {" "}
          next
        </Button>
        {/* <div></div> */}
        <div></div>
        {fragen[fragenIndex].choices.map((choice, key) => (
          <>
            <Button
              variant="dark"
              className={`${styles["show" + (key + 1)]}`}
              onClick={() => showChoice(key + 1)}
            >
              show{" "}
            </Button>
            <Card
              className={`${styles["Antwort" + (key + 1)]}`}
              bg={cardColors[key]}
              border={"secondary"}
              onClick={(event) => changeColor(key, event)}
              onContextMenu={(event) => changeColor(key, event)}
              style={{
                fontSize: "22px",
                marginTop: "3vh",
                borderRadius: "20px",
              }}
            >
              {" "}
              <Card.Body>
                <Card.Title
                //   className="grid-item2 "
                //   style={{ fontSize: "25px" }}
                >
                  <h3>
                    {String.fromCharCode(65 + key)}: {choice}
                  </h3>
                </Card.Title>
              </Card.Body>
            </Card>
          </>
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
        <Button variant="info" onClick={startTimer} disabled={timerRunning}>
          start
        </Button>
        <Button variant="danger" onClick={stopTimer} disabled={!timerRunning}>
          stop
        </Button>
        <Button variant="light" onClick={restartTimer}>
          restart
        </Button>
        <textarea
          style={{
            // width: "100%",
            // minHeight: "100px",
            resize: "vertical",
            boxSizing: "border-box",
          }}
          value={timerDuration}
          onChange={(e) => setTimerDuration(e.target.value)}
        />
      </div>

      <div className={styles.Punkte}>
        <Button
          variant="danger"
          className={styles.subA}
          onClick={() => setPunkte("A", -1)}
        >
          {" "}
          sub{" "}
        </Button>
        <Card className={styles.PunkteA}>
          <Card.Title style={{ fontSize: "35px" }}>{punkteA} Punkte</Card.Title>
        </Card>
        <Button
          variant="info"
          className={styles.addA}
          onClick={() => setPunkte("A", 1)}
        >
          {" "}
          add{" "}
        </Button>

        <Button
          variant="danger"
          className={styles.subB}
          onClick={() => setPunkte("B", -1)}
        >
          {" "}
          sub{" "}
        </Button>
        <Card className={styles.PunkteB}>
          <Card.Title style={{ fontSize: "35px" }}>
            {punkteB} Punkte{" "}
          </Card.Title>
        </Card>
        <Button
          variant="info"
          className={styles.addB}
          onClick={() => setPunkte("B", 1)}
        >
          {" "}
          add{" "}
        </Button>
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
                <Card.Body
                  style={{ fontSize: "30px" }}
                  className="d-flex justify-content-start align-items-end flex-wrap miniText"
                >
                  <div>{player.userID}</div>
                </Card.Body>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamModPage;

import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dropdown,
  Button,
  Card,
  ListGroup,
  Container,
  Row,
  Col,
  Form,
  CardBody,
  Image,
} from "react-bootstrap";
import {
  createPlayerTrue,
  createPlayerFalse,
  setRightPoints,
  setManuellPoints,
} from "../slices/ShowMasterSlice";
import io from "socket.io-client";
import useSound from "use-sound";
import Navigation from "./Navigation";
import "../layout/scrollbar.css";
import "../layout/streamingPage.css";
import useTSRemoteApp from "../TS5-RemoteAPI/index.ts";
import "../layout/animatedBorder.css";
import "../layout/background.css";
import CameraComponent from "./CameraComponent.js";
import Webcam from "react-webcam";
import tom1 from "../images/tom1.jpg";
import jan1 from "../images/jan3.jpg";
import tim1 from "../images/tim1.jpg";
import dana1 from "../images/dana1.jpg";
import noPic1 from "../images/noPic1.jpg";
import { ReactComponent as BackgroundSVG } from "../images/background1.svg";

const server = process.env.REACT_APP_API_SERVER;
// sehen wer spricht - Teamspeak 5 plugin

const StreamingPage = () => {
  const dispatch = useDispatch();
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState("");
  const isHost = useSelector((state) => state.loginPlayer.isHost);
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const [buzzerPressedBy, setBuzzerPressedBy] = useState("");
  const [allPoints, setAllPoints] = useState([]); // punkte von allen spieler
  const [sortedPoints, setSortedPoints] = useState([]); // punkte ohne chris
  const rightPointsValue = useSelector((state) => state.showMaster.rightPoints); // wert von plus punkten für richtige antwort
  const wrongPointsValue = useSelector((state) => state.showMaster.wrongPoints);
  const [playerMessages, setPlayerMessages] = useState({}); // Nachrichten für jeden Spieler
  const [editMode, setEditMode] = useState(false); // edit mode für karte
  const manuellPoints = useSelector((state) => state.showMaster.manuellPoints);
  const [manuellPointsInput, setManuellPointsInput] = useState("");

  const [showQuestion, setShowQuestion] = useState(false);
  const [frage, setFrage] = useState();
  const [fragenIndex, setFragenIndex] = useState(0);
  const [kategorie, setKategorie] = useState();
  // Sound
  const [volume, setVolume] = useState(0.3);
  const [playSound, { error }] = useSound("/pfad/zur/sounddatei.mp3", {
    volume: 1,
  });
  //  teamspeak shit
  const talkers = useRef({ names: [] });
  const talkingNames = useRef([]);
  const talkingMap = useRef(new Map());
  const [talkingMap2, setTalkingmap] = useState([]);
  var playerChris = useRef({});

  // let talkers = { names: [] };
  //let talkingNames = [];
  //let talkingMap1 = new Map();

  const [talkMap, setTalkmap] = useState([]);
  const { clientsInChannel } = useTSRemoteApp({
    remoteAppPort: 5899,
    logging: false,
    auth: {
      name: "etst",
      version: "1.0.0.0",
      identifier: "kok",
      description: "hond",
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
      /*
      if (client.talkStatus === 1) {
        // console.log(nickname, "is talking", client.talkStatus === 1);
        // talkingMap.current.set(nickname, true);
      } else {
        // console.log(nickname, "no talking", client.talkStatus);
        // talkingMap.current.set(nickname, false);

      }*/
    }
    talkingNames.current = newTalkingNames;
    // console.log(talkingNames, " talking names");
    // console.log(talkingMap.get(talkingNames[0]));
  }, [clientsInChannel]);
  // console.log(talkingMap);
  useEffect(() => {
    if (error) {
      console.error("Fehler beim Abspielen des Sounds:", error);
    }
  }, [error]);
  // webcam---------------
  const [deviceId, setDeviceId] = useState(null);
  const [deviceId2, setDeviceId2] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);

  const handleDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    setVideoDevices(videoDevices);
    // setDeviceId to default video device ID
    setDeviceId(videoDevices[0]?.deviceId);
  };
  console.log(videoDevices);
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

  const playStoredSound = (soundFile) => {
    const base64Sound = localStorage.getItem(soundFile);
    if (base64Sound) {
      // Base64-String in einen ArrayBuffer umwandeln
      const arrayBuffer = Uint8Array.from(atob(base64Sound), (c) =>
        c.charCodeAt(0)
      ).buffer;

      // Neue Audioquelle erstellen
      const audio = new Audio();

      // Audioquelle aus dem ArrayBuffer laden
      audio.src = URL.createObjectURL(
        new Blob([arrayBuffer], { type: "audio/mp3" })
      );
      audio.volume = volume;
      // Audio abspielen
      audio.play();
    }
  };

  useEffect(() => {
    const newSocket = io(`ws://${server}:8080`, {});

    newSocket.on("connect", () => {
      console.log("WebSocket-Verbindung hergestellt");
      newSocket.emit("sendLogIn", { isHost: isHost });
    });
    // sound setzen
    newSocket.on("sounds", (soundFile) => {
      console.log("sounds bekommen");
      localStorage.setItem("buzzerSound", soundFile.buzzerSound);
      localStorage.setItem("rightSound", soundFile.rightSound);
      localStorage.setItem("falseSound", soundFile.falseSound);
      localStorage.setItem("releaseSound", soundFile.releaseSound);
    });

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
      console.log("showQuestion");
      setFrage(body.frage);
      setKategorie(body.kategorie);
      setFragenIndex(parseInt(body.fragenIndex));
    });
    newSocket.on("streamingQuestion", (body) => {
      console.log("streamingQuestion");
      setFrage(body.frage);
      setKategorie(body.kategorie);
      setFragenIndex(parseInt(body.fragenIndex));
    });
    // newSocket.on('hideQuestion', (body) => {
    //     setFrage()
    //     setKategorie(body.kategorie)
    //     setFragenIndex(parseInt(body.fragenIndex))
    // });

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

  function TsTest() {
    //console.log("clientsInChannel:", clientsInChannel);
  }

  //console.log(talkingNames.current[0],   talkingMap.current.get(talkingNames.current[0]));
  // console.log(
  //   // talkingMap.current,
  //   // talkingMap.current.get(talkingNames.current[0]),
  //   // talkingNames.current
  //   talkingMap2,
  //   " map2"
  // );
  const camWidth = "20%";
  const camHeight = "10%";

  console.log(talkingMap2, talkingNames.current);
  return (
    <div
    // className=""
    // style={{
    //   backgroundImage: "url(" + background + ")",
    //   backgroundSize: "cover",
    //   backgroundPosition: "center center",
    //   // marginTop: "-10px"
    // }}
    >
      <div className="backgroundContainer">
        <BackgroundSVG className="backgroundClass" />
        <BackgroundSVG className="backgroundClass" style={{left: "-100%"}}/>
        {/* <BackgroundSVG className="backgroundClass" style={{right: "100%"}}/> */}
        {/* Weitere Kopien des SVG-Elements, je nach Bedarf */}
      </div>
      <div className="grid-container2">
        <div></div>
        <div>
          <Card
            bg="dark"
            border={talkingMap2.includes("") ? "info" : "secondary"}
            style={{
              fontSize: "22px",
              // padding: "10px 10px",
              // marginBottom: "40px",
              marginTop: "3vh",
              borderRadius: "20px",
            }}
          >
            <Card.Body>
              <Card.Title
                className="grid-item2 text-center"
                style={{ fontSize: "32px" }}
              >
                <h3>
                  Frage {fragenIndex + 1} ({kategorie}):
                </h3>
                <p>{frage}</p>
              </Card.Title>
            </Card.Body>
          </Card>
        </div>
        <div></div>
      </div>
      <div className="flex-container" id="grid-container">
        {sortedPoints.map((player, index) => (
          <div className={"flex-item" + index} key={index}>
            <Card
              bg="dark"
              key={index}
              border={
                talkingMap2.includes(player.tsName)
                  ? "info"
                  : buzzerPressedBy === player.userID
                  ? "warning"
                  : player.isReady
                  ? "success"
                  : "secondary"
              }
              style={{
                borderRadius: "20px",
                overflowY: "hidden",
                backgroundImage: `url(${
                  player.userID === "Tom"
                    ? noPic1
                    : player.userID === "Tim"
                    ? tim1
                    : player.userID === "Jan"
                    ? jan1
                    : player.userID === "Dana"
                    ? dana1
                    : noPic1
                })`,
                backgroundSize: "cover",
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
                <Card.Title
                  style={{ fontSize: "30px" }}
                  className="d-flex justify-content-between align-items-center flex-wrap"
                >
                  <div>{player.userID}:</div>
                  <div>{player.currentPoints} p</div>
                </Card.Title>
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
                {!player.isHost ? (
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
                ) : null}
              </Card.Body>
            </Card>
          </div>
        ))}
        <div
          className={"flex-chris"}
          key={5}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div
            className="webcam-container"
            style={{
              borderRadius: "20px",
              overflow: "hidden",
              width: "auto",
              height: "60%",
              // marginTop: "20%"
            }}
          >
            <Webcam
              style={{ width: "100%", height: "100%", objectFit: "scale-down" }}
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
                key={5}
                border={
                  talkingMap2.includes(playerChris.current.tsName)
                    ? "info"
                    : buzzerPressedBy === playerChris.current.userID
                    ? "warning"
                    : playerChris.current.isReady
                    ? "success"
                    : "secondary"
                }
                style={{
                  borderRadius: "20px",
                  overflowY: "hidden",
                  height: "60%", // Anpassen der Höhe nach Bedarf
                  width: "100%",
                  position: "absolute",
                  top: "0%",
                  backgroundColor: "rgba(0,0,0,0.0)",
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
                  <Card.Title
                    style={{ fontSize: "30px" }}
                    className="d-flex justify-content-between align-items-center flex-wrap"
                  >
                    <div className="text-with-outline">
                      {playerChris.current.userID}:
                    </div>
                    {/* <div>{playerChris.current.currentPoints} p</div> */}
                  </Card.Title>
                  {playerChris.current.isHost ? (
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
                  ) : null}
                </Card.Body>
              </Card>
            </div>
          ) : null}
        </div>

        {/* {(index) % 1 === 0  ? <div></div> : null} */}
      </div>

      <Navigation />
    </div>
  );
};

export default StreamingPage;

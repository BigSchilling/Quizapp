import styles from "../layout/streamingPage.module.css"; // ein und aus kommentieren falls es rumspackt
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
import useTSRemoteApp from "../TS5-RemoteAPI/index.ts";
import "../layout/animatedBorder.css";
import "../layout/background.css";
import "../layout/background2.css";
import CameraComponent from "./CameraComponent.js";
import Webcam from "react-webcam";
import tom1 from "../images/tom3.jpg";
import jan1 from "../images/jan3.jpg";
import tim1 from "../images/tim1.jpg";
import dana1 from "../images/dana1.jpg";
import noPic1 from "../images/noPic1.jpg";
import { ReactComponent as BackgroundSVG } from "../images/background1.svg";
import { ReactComponent as BackgroundSVG2 } from "../images/background2.svg";
import ReactPlayer from "react-player";
const server = process.env.REACT_APP_API_SERVER;
export const soundGif =
  "https://miro.medium.com/v2/resize:fit:960/1*ll6000BtRBCGWfq5xK2GeA.gif";

// sehen wer spricht - Teamspeak 5 plugin
export const aktuellerMod = "Tim"; // mod ändern!!
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
  const [assets, setAssets] = useState();
  const [assetIndex, setAssetIndex] = useState(0);
  // Sound
  const [volume, setVolume] = useState(0.3);
  const [playSound, { error }] = useSound("/pfad/zur/sounddatei.mp3", {
    volume: 1,
  });
  // reactplayer variables
  const playerVolumeRef = useRef(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [playerSliderValue, setPlayerSliderValue] = useState(
    playerVolumeRef.current
  );
  const videoPlayerRef = useRef(null);
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
    newSocket.on("buzzerReleasedWithTimer", (body) => {
      setBuzzerPressed(false);
      setBuzzerPressedBy(null);
      // console.log(`Startpage Buzzer got released`);
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
      console.log("showQuestion", body.assetIndex, body.assets);
      setFrage(body.frage);
      setKategorie(body.kategorie);
      setFragenIndex(parseInt(body.fragenIndex));
      setAssets(body.assets);
      setAssetIndex(body.assetIndex);
    });
    newSocket.on("streamingQuestion", (body) => {
      console.log("streamingQuestion");
      setFrage(body.frage);
      setKategorie(body.kategorie);
      setFragenIndex(parseInt(body.fragenIndex));
      setAssets(body.assets);
      setAssetIndex(0);
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
    <div
      id="test"
      className={styles.container}
      // style={{
      //   backgroundImage: "url(" + background + ")",
      //   backgroundSize: "cover",
      //   backgroundPosition: "center center",
      //   // marginTop: "-10px"
      // }}
    >
      {/* <div className="backgroundContainer">
        {/* <BackgroundSVG2 className="backgroundClass2" /> */}
      {/* <BackgroundSVG className="backgroundClass" />
        <BackgroundSVG className="backgroundClass" style={{ left: "-100%" }} /> */}
      {/* Weitere Kopien des SVG-Elements, je nach Bedarf */}
      {/* </div> */}
      <div className={styles.gridcontainer2}>
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
                className={styles.griditem2 + " text-center"}
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
      <div className={styles.flexcontainer} id="grid-container">
        {sortedPoints.map((player, index) => (
          <div className={`${styles[`flexitem${index}`]}`} key={index}>
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
                  className="d-flex justify-content-between align-items-center flex-wrap miniText"
                >
                  <div>{player.userID}:</div>
                  {player.userID === aktuellerMod ? null : (
                    <div>{player.currentPoints} p</div>
                  )}
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
                {player.userID === aktuellerMod ? null : (
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
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
        <div
          className={styles.flexchrisBild}
          key={5}
          style={{ display: "flex", flexDirection: "column" }}
        >
          {assets &&
          (assets[assetIndex].bild ||
            assets[assetIndex].sound ||
            assets[assetIndex].video) ? (
            <div id="bild-placeholder" className={styles.imageplaceholder}>
              <Card
                border="dark"
                style={{
                  borderWidth: "7px",
                  borderRadius: "10px",
                  overflowY: "hidden",
                }}
              >
                <div
                  className={styles.imagecontainer}
                  style={{ maxHeight: "40px" }}
                >
                  {assets[assetIndex].video || assets[assetIndex].sound ? (
                    <div
                      style={{
                        // display: "flex",
                        // border: "3px solid white",
                        width: "100%",
                        minHeight: "100%",
                      }}
                    >
                      {assets[assetIndex].sound ? (
                        <>
                          <Image
                            src={soundGif}
                            className={styles.image}
                            alt="Bild"
                            style={{ objectFit: "fill", filter: "blur(15px)" }}
                          />
                          <Image
                            src={soundGif}
                            className={styles.image}
                            alt="Bild"
                            style={{ objectFit: "contain" }}
                          />
                        </>
                      ) : null}
                      <ReactPlayer
                        url={
                          assets[assetIndex].video || assets[assetIndex].sound
                        }
                        playing={isPlaying}
                        controls={false}
                        loop={true}
                        width="100%"
                        // height="100%"
                        volume={0}
                        ref={(p) => {
                          videoPlayerRef.current = p;
                        }}
                        style={{
                          display: assets[assetIndex].sound ? "none" : "",
                          objectFit: "scale-down",
                          // minHeight: "100vh"
                          // minHeight: "100%",
                          padding: "0%",
                          marginBottom: "-10%",
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <Image
                        src={assets[assetIndex].bild}
                        className={styles.image}
                        alt="Bild"
                        style={{ objectFit: "fill", filter: "blur(15px)" }}
                      />
                      <Image
                        src={assets[assetIndex].bild}
                        className={styles.image}
                        alt="Bild"
                        style={{ objectFit: "contain" }}
                      />
                    </>
                  )}
                </div>
              </Card>
            </div>
          ) : null}

          <div
            className={styles.webcamcontainer}
            style={{
              borderRadius: "20px",
              overflow: "hidden",
              width: "auto",
              height: "65%",
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
              className={styles.overlaycard}
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
                    : playerChris.current.userID == aktuellerMod
                    ? "dark"
                    : "secondary"
                }
                style={{
                  borderWidth: "7px",
                  borderRadius: "20px",
                  overflowY: "hidden",
                  height: "65%", // Anpassen der Höhe nach Bedarf
                  width: "100%",
                  position: "absolute",
                  top: "35%",
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
                    className="d-flex justify-content-between align-items-center flex-wrap miniText"
                  >
                    <div className="text-with-outline miniText">
                      {playerChris.current.userID}:
                    </div>
                    {playerChris.current.userID != aktuellerMod ? (
                      <div>{playerChris.current.currentPoints} p</div>
                    ) : null}
                  </Card.Title>
                  {playerChris.current.userID != aktuellerMod ? (
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

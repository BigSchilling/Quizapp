import "../layout/ShowMasterPage.css";
import "../layout/scrollbar.css";
import React, { useEffect, useRef, useState } from "react";
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
  FormGroup,
  Image,
} from "react-bootstrap";
import {
  createPlayerTrue,
  createPlayerFalse,
  setRightPoints,
  setManuellPoints,
  setTimer,
} from "../slices/ShowMasterSlice";
import io from "socket.io-client";
import FragenData from "../questionsCatalog/folge14Tim.json"; // datei mit fragen ändern!
import useSound from "use-sound";
import tom1 from "../images/tom1.jpg";
import jan1 from "../images/jan3.jpg";
import tim1 from "../images/tim1.jpg";
import dana1 from "../images/dana1.jpg";
import noPic1 from "../images/noPic1.jpg";
import chris1 from "../images/chris2.jpg";
import ShowMasterPlayer from "./test/ShowMasterPlayer";
import ReactPlayer from "react-player";
import { useNavigate } from 'react-router-dom';
const server = process.env.REACT_APP_API_SERVER;

const ShowMasterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const isHost = useSelector((state) => state.loginPlayer.isHost);
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const [buzzerPressedBy, setBuzzerPressedBy] = useState(null);
  const [allPoints, setAllPoints] = useState([]); // punkte von allen spieler
  const [sortedPoints, setSortedPoints] = useState([]); // punkte sortiert
  const rightPointsValue = useSelector((state) => state.showMaster.rightPoints); // wert von plus punkten für richtige antwort
  const wrongPointsValue = useSelector((state) => state.showMaster.wrongPoints);
  const [playerMessages, setPlayerMessages] = useState({}); // Nachrichten für jeden Spieler
  const [editMode, setEditMode] = useState(false); // edit mode für karte
  const manuellPoints = useSelector((state) => state.showMaster.manuellPoints);
  const [manuellPointsInput, setManuellPointsInput] = useState("");
  const [timer, setTimerChange] = useState(2000);
  const fragen = FragenData.fragen;
  const [fragenIndex, setFragenIndex] = useState(1);
  const [assetIndex, setAssetIndex] = useState(0);
  // assetIndex.current = 0;
  const [answerToggles, setAnswerToggles] = useState(
    new Array(fragen[fragenIndex].antworten.length).fill(false)
  );
  const [showQuestion, setShowQuestion] = useState(false);
  let assetPointIndex = useRef(0);
  // Sound
  const volumeRef = useRef(0.5); // Verwenden Sie useRef für die volume-Variable
  const [sliderValue, setSliderValue] = useState(volumeRef.current); // Zustand für den Slider-Wert
  // Youtube video/ React Player nur Sound
  const playerVolumeRef = useRef(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [playerSliderValue, setPlayerSliderValue] = useState(
    playerVolumeRef.current
  );

  const videoPlayerRef = useRef(null);

  const playStoredSound = (soundFile) => {
    const base64Sound = localStorage.getItem(soundFile);
    if (base64Sound) {
      const arrayBuffer = Uint8Array.from(atob(base64Sound), (c) =>
        c.charCodeAt(0)
      ).buffer;
      const audio = new Audio();
      audio.src = URL.createObjectURL(
        new Blob([arrayBuffer], { type: "audio/mp3" })
      );
      audio.volume = volumeRef.current; // Verwenden Sie die aktuelle volume-Referenz
      audio.play();
    }
  };
  const adjustVolume = (e) => {
    volumeRef.current = parseFloat(e.target.value); // Aktualisieren Sie die volume-Referenz
    setSliderValue(volumeRef.current); // Aktualisieren Sie den Zustand des Sliders
  };
  useEffect(() => {
    const newSocket = io(`ws://${server}:8080`);
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

    newSocket.on("buzzerReleasedWithTimer", (body) => {
      setBuzzerPressed(false);
      setBuzzerPressedBy(null);
      // console.log(`Startpage Buzzer got released`);
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
    setSocket(newSocket);

    return () => {
      // Schließe die WebSocket-Verbindung beim Komponentenabbau
      newSocket.disconnect();
    };
  }, [server]);

  const sendMessage = () => {
    console.log("Message war: " + inputMessage); // statt console dann bei showMaster anzeigen
    // Überprüfe, ob die Socket.IO-Instanz vorhanden ist
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendMessage", inputMessage);
    }
  };

  const sendBuzzerReleasedFree = () => {
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendBuzzerReleasedFree", null);
    }
  };
  const sendBuzzerReleased = () => {
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendBuzzerReleased", null);
    }
  };
  const sendBuzzerReleasedWithTimer = () => {
    let body = { userID: buzzerPressedBy, timeout: timer };
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendBuzzerReleasedWithTimer", body);
    }
  };
  const handleChange = (e) => {
    const { value } = e.target;
    // Führe beide Aktionen aus
    setInputMessage(value);
    sendMessage();
  };
  const setCreatePlayer = () => {
    dispatch(createPlayerTrue());
  };
  const logoutAll = () => {
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendLogOutAll", { loggedIn: false });
    }
  };
  const navigateToTeams = () => {
    navigate("/teamsmod")
  }
  const logoutPlayer = (player) => {
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendLogOutPlayer", { userID: player });
    }
  };
  const rightPoints = () => {
    if (timer !== 0) sendBuzzerReleasedWithTimer();
    else sendBuzzerReleased();
    if (socket) {
      console.log("rightPoints gedrückt");
      socket.emit("sendRightPoints", {
        userID: buzzerPressedBy,
        rightPoints: manuellPoints,
      });
      playStoredSound("rightSound");
    }
  };
  const wrongPoints = () => {
    if (timer !== 0) sendBuzzerReleasedWithTimer();
    else sendBuzzerReleased();
    if (socket) {
      console.log("wrong Points gedrückt");
      socket.emit("sendWrongPoints", {
        userID: buzzerPressedBy,
        wrongPoints: wrongPointsValue,
      });
      playStoredSound("falseSound");
    }
  };
  const changeRightPoints = (value) => {
    dispatch(setRightPoints({ rightPoints: value }));
  };
  useEffect(() => {
    const sortedPoints = [...allPoints].sort(
      (a, b) => b.currentPoints - a.currentPoints
    );
    setSortedPoints(sortedPoints);
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

  const newSession = () => {
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendNewSession");
    }
  };

  const changePoints = (userID, value) => {
    const manuellPointsValue = value * manuellPoints;
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendChangePoints", {
        userID: userID,
        manuellPoints: manuellPointsValue,
      });
    }
  };
  const setManuellPointsOnChange = (e) => {
    const { value } = e.target;
    setManuellPointsInput(value); // Wert des Eingabefelds speichern
    dispatch(setManuellPoints({ manuellPoints: value })); // Manuell Punkte ändern
  };
  const setTimeout = (e) => {
    const { value } = e.target;
    setTimerChange(value); // Wert des Eingabefelds speichern
    dispatch(setTimer({ timer: value })); // Manuell Punkte ändern
  };
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
      setTimerChange(2000);
      setAssetIndex(0);
      assetPointIndex.current = 0;
      dispatch(setManuellPoints({ manuellPoints: 5 }));
      const frage = fragen[newValue].frage;
      const kategorie = fragen[newValue].kategorie;
      const assets = fragen[newValue].assets;

      socket.emit("sendStreamingQuestion", {
        frage: frage,
        fragenIndex: newValue,
        kategorie: kategorie,
        assets: assets,
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
      const assets = fragen[value].assets;
      console.log("asses showmaster", assets);
      socket.emit("sendShowQuestion", {
        frage: frage,
        fragenIndex: value,
        kategorie: kategorie,
        assets: assets,
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
      });
    }
  };
  const resetShowQuestion = (index) => {
    setShowQuestion(false);
    if (socket) {
      socket.emit("sendHideQuestion", {
        fragenIndex: index,
        kategorie: fragen[index].kategorie,
        assets: " ",
      });
    }
  };
  const changeAssetIndex = (value) => {
    const newValue = assetIndex + value;
    if (newValue < 0 || newValue >= fragen[fragenIndex].assets.length) {
      console.log("falsch", assetIndex, fragen[fragenIndex].assets.length);
      return;
    } else {
      if (newValue > assetPointIndex.current) {
        if (newValue % 2 == 0 && value === 1) {
          setManuellPointsInput(manuellPoints - 1); // Wert des Eingabefelds speichern
          dispatch(setManuellPoints({ manuellPoints: manuellPoints - 1 }));
          // setManuellPoints(manuellPoints - 1);
          assetPointIndex.current = newValue;
        }
      }

      console.log("drin");
      setAssetIndex(newValue);
      const frage = fragen[fragenIndex].frage;
      const kategorie = fragen[fragenIndex].kategorie;
      const assets = fragen[fragenIndex].assets;
      console.log("change assets showmaster", assets);
      console.log(newValue, "newValue");
      socket.emit("sendShowQuestion", {
        frage: frage,
        fragenIndex: fragenIndex,
        kategorie: kategorie,
        assets: assets,
        assetIndex: newValue,
      });
    }
  };

  const sendReactPlayerControls = (data) => {
    console.log("sendReactPlayerControls page", data);
    if (socket) socket.emit("sendReactPlayerControls", data);
  };

  // React player
  const adjustPlayerVolume = (e) => {
    playerVolumeRef.current = parseFloat(e.target.value);
    setPlayerSliderValue(playerVolumeRef.current);
  };

  const handlePlayPause = (data) => {
    console.log("handle play", data);
    setIsPlaying(data);
  };
  const sendPlayPause = () => {
    const data = { isPlaying: !isPlaying };
    console.log("send playpause", data);
    socket.emit("sendReactPlayerControls", data);
  };
  // wird aufgerufen wenn server die sekunden weiterleitet und video spult an die stelle
  const handleSeekToTime = (totalSeconds) => {
    if (!isNaN(totalSeconds) && videoPlayerRef.current) {
      console.log("player seek gesetzt");
      videoPlayerRef.current.seekTo(totalSeconds);
    }
  };
  // Moderator kann zur bestimmten stelle springen
  const sendSeekToTime = () => {
    const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
    if (!isNaN(totalSeconds)) {
      const data = { seekTime: totalSeconds };
      socket.emit("sendReactPlayerControls", data);
    }
  };
  var maxHeightVar = "8rem";
  return (
    <div className="grid-container3">
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        value={sliderValue} // Verwenden Sie den Zustand für den Slider-Wert
        onChange={(e) => adjustVolume(e)}
      />
      <div className="grid-container2">
        <div style={{ minWidth: "100%" }}>
          <Button
            variant="primary"
            className="text-center"
            style={{ width: "100%", height: "100%" }}
            onClick={() => changeFragenIndex(-1)}
          >
            {"vorherige Frage"}
          </Button>
        </div>
        <div style={{ width: "100%" }}>
          <Card
            bg="dark"
            // className="text-center"
            border="secondary"
            style={{
              fontSize: "30px",
              //   padding: "10px 10px",
              //   marginBottom: "40px",
              //   marginTop: "40px",
            }}
          >
            <Card.Body>
              <Card.Title className="text-center" style={{ fontSize: "35px" }}>
                <h3>
                  Frage {fragenIndex + 1} ({fragen[fragenIndex].kategorie}):
                </h3>
                <p>{fragen[fragenIndex].frage}</p>
              </Card.Title>
            </Card.Body>
          </Card>
        </div>
        <div>
          <Button
            variant="primary"
            style={{ width: "100%", height: "100%" }}
            onClick={() => changeFragenIndex(1)}
          >
            {"nächste Frage"}
          </Button>
        </div>
      </div>

      <Container>
        <div className="text-center">
          <Button
            variant={showQuestion ? "dark" : "secondary"}
            style={{ marginBottom: "20px" }}
            onClick={showQuestion ? changeHideQuestion : changeShowQuestion}
          >
            {!showQuestion ? "Frage anzeigen" : "Frage angezeigt"}
          </Button>

          <div
            style={{
              display: "flex",
              justifyContent: "center", // Zentriert horizontal
              alignItems: "center", // Zentriert vertikal
              gap: "20px", // Abstand zwischen den Buttons
            }}
          >
            {fragen[fragenIndex].antworten.map((antwort, antwortIndex) => (
              <Button
                key={antwortIndex}
                variant={answerToggles[antwortIndex] ? "success" : "dark"}
                style={{ fontSize: "20px" }}
                onClick={() => setAnswerToggleButton(antwortIndex)}
              >
                {antwort}
              </Button>
            ))}
          </div>
        </div>
      </Container>
      <div className="d-flex flex-column align-items-start">
        {fragen[fragenIndex].assets[assetIndex] ? (
          <div
            className="d-flex flex-row"
            style={{ gap: "10px", marginTop: "10px" }}
          >
            {/* Reactplayer div*/}
            {fragen[fragenIndex].assets[assetIndex].video || fragen[fragenIndex].assets[assetIndex].sound ? (
              <div>
                <div
                  style={{
                    display: "block",
                    border: "3px solid white",
                    width: "auto",
                    height: "auto",
                  }}
                >
                  <Button onClick={sendPlayPause}>
                    {" "}
                    {isPlaying ? "Pause Video" : "Play Video"}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={playerSliderValue}
                    onChange={(e) => adjustPlayerVolume(e)}
                  />
                  {/* <Image
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Test-Logo.svg/783px-Test-Logo.svg.png"
          style={{ display: "block", objectFit: "" }}
        /> */}
                  <ReactPlayer
                    url={fragen[fragenIndex].assets[assetIndex].video || fragen[fragenIndex].assets[assetIndex].sound}
                    playing={isPlaying}
                    controls={true}
                    loop={true}
                    width="100%"
                    height="100%"
                    volume={playerVolumeRef.current}
                    ref={(p) => {
                      videoPlayerRef.current = p;
                    }}
                    // style={{ display: "none", border: "3px solid white" }}
                  />
                  <Form>
                    <FormGroup controlId="formSeek">
                      <Form.Label>Springe zu:</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Minutes"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                      />
                      <Form.Control
                        type="number"
                        placeholder="Seconds"
                        value={seconds}
                        onChange={(e) => setSeconds(e.target.value)}
                      />
                    </FormGroup>
                    <Button onClick={sendSeekToTime}>Seek</Button>
                  </Form>
                </div>
              </div>
            ) : null}
            <Button
              variant="primary"
              style={{ fontSize: "20px" }}
              onClick={() => changeAssetIndex(-1)}
            >
              vorheriges Asset
            </Button>
            <Button
              variant="primary"
              style={{ fontSize: "20px" }}
              onClick={() => changeAssetIndex(1)}
            >
              Nächstes Asset
            </Button>
            <Image
              src={fragen[fragenIndex].assets[assetIndex].bild }
              style={{ width: "25%" }}
            />
          </div>
        ) : null}
        <FormGroup style={{ marginTop: "2vh" }}>
          <Form.Label>Richtige Punkte</Form.Label>
          <Form.Control
            id="manuellPointsInput"
            bsClass="test"
            type="number"
            value={manuellPoints}
            onChange={setManuellPointsOnChange}
            style={{ width: "10px", maxWidth: "50px", fontSize: "20px" }}
          />
        </FormGroup>
        <FormGroup style={{ marginTop: "2vh" }}>
          <Form.Label>Timer für Buzzer in ms</Form.Label>
          <Form.Control
            id="manuellPointsInput"
            bsClass="test"
            type="number"
            value={timer}
            onChange={setTimeout}
            style={{ width: "10px", maxWidth: "50px", fontSize: "20px" }}
          />
        </FormGroup>
      </div>
      <div
        className="d-flex flex-column align-items-center"
        style={{ marginTop: "-20vh" }}
      >
        <Button
          variant={!buzzerPressed ? "primary" : "info"}
          style={{
            fontSize: "80px",
            width: "auto", // Breite des Buttons
            height: "180px",
            padding: "10px 20px",
            marginBottom: "20px",
            marginTop: "2%",
            borderRadius: "20px",
            backgroundImage: `url(${
              buzzerPressedBy === "Tom"
                ? noPic1
                : buzzerPressedBy === "Tim"
                ? tim1
                : buzzerPressedBy === "Jan"
                ? jan1
                : buzzerPressedBy === "Dana"
                ? dana1
                : buzzerPressedBy === "Chris"
                ? chris1
                : null
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
          onClick={null}
          // disabled={buzzerPressed}
        >
          {buzzerPressedBy || "BUZZER!"}
        </Button>
        {buzzerPressed ? (
          <div className="d-flex justify-content-center align-items-center">
            <Button
              variant="danger"
              style={{
                fontSize: "50px",
                padding: "10px 20px",
                marginBottom: "20px",
                marginRight: "20px",
              }}
              onClick={wrongPoints}
            >
              {"Falsch"}
            </Button>
            <Button
              variant="success"
              style={{
                fontSize: "50px",
                padding: "10px 20px",
                marginBottom: "20px",
              }}
              onClick={rightPoints}
            >
              {"Richtig!"}
            </Button>
          </div>
        ) : null}

        <Button
          variant="warning"
          style={{
            fontSize: "30px",
            padding: "10px 20px",
            marginBottom: "40px",
            marginTop: "40px",
          }}
          onClick={sendBuzzerReleasedFree}
        >
          {"freigeben"}
        </Button>
      </div>

      <div>
        <Container id="UserManagementPageListComponent">
          <Row
            xs={1}
            md={2}
            lg={4}
            xl={4}
            className="justify-content-center align-items-center "
          >
            {sortedPoints.map((player) => (
              <Col key={player.userID} className="mb-3">
                <Card
                  bg="dark"
                  border={player.isReady ? "success" : "secondary"}
                  style={{
                    width: "18rem",
                    maxHeight: "1000px",
                    overflowY: "auto",
                  }}
                >
                  <Card.Body
                    className="d-flex flex-column"
                    style={{ minHeight: "100%", paddingBottom: "10px" }}
                  >
                    <Card.Title
                      style={{ fontSize: "30px" }}
                      className="d-flex justify-content-between align-items-center flex-wrap"
                    >
                      <div>{player.userID}:</div>
                      <div>{player.currentPoints} p</div>
                    </Card.Title>
                    <Card.Title
                      style={{
                        fontSize: "15px",
                        fontWeight: "bold",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Button
                        variant="danger"
                        onClick={() => changePoints(player.userID, -1)}
                        style={{ width: "50%", marginRight: "5px" }} // Breite auf 50% des verfügbaren Platzes setzen
                      >
                        minus
                      </Button>

                      <Button
                        variant="success"
                        onClick={() => changePoints(player.userID, 1)}
                        style={{ width: "50%", marginLeft: "5px" }} // Breite auf 50% des verfügbaren Platzes setzen
                      >
                        plus
                      </Button>
                    </Card.Title>

                    <div
                      className="d-flex flex-column flex-grow-1 align-items-start"
                      style={{ overflowY: "auto" }}
                    >
                      <ListGroup style={{ width: "100%" }}>
                        <ListGroup.Item
                          bg="secondary"
                          style={{ minHeight: "100px", overflowY: "auto" }}
                        >
                          <textarea
                            style={{
                              width: "100%",
                              minHeight: "100px",
                              resize: "vertical",
                              boxSizing: "border-box",
                            }}
                            value={playerMessages[player.userID]}
                            readOnly
                          />
                        </ListGroup.Item>
                        <ListGroup.Item bg="dark">
                          current Rights: {player.currentRights}
                        </ListGroup.Item>
                        <ListGroup.Item bg="dark">
                          current Wrongs: {player.currentWrongs}
                        </ListGroup.Item>
                        <ListGroup.Item bg="dark">
                          all Time Rights: {player.allTimeRights}
                        </ListGroup.Item>
                        <ListGroup.Item bg="dark">
                          all Time Wrongs: {player.allTimeWrongs}
                        </ListGroup.Item>
                        <ListGroup.Item bg="dark">
                          highest Points: {player.highestPoints}
                        </ListGroup.Item>
                      </ListGroup>
                    </div>
                    <Button
                      onClick={() => logoutPlayer(player.userID)}
                      variant="danger"
                    >
                      Log Out Player
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <div>
            <Button
              variant="info"
              style={{
                fontSize: "20px",
                padding: "10px 20px",
                marginBottom: "20px",
                marginTop: "20px",
              }}
              onClick={newSession}
            >
              {"New Session"}
            </Button>

            <Button
              variant="success"
              style={{
                fontSize: "20px",
                padding: "10px 20px",
                marginBottom: "40px",
                marginTop: "40px",
              }}
              onClick={setCreatePlayer}
            >
              {"Create Player"}
            </Button>
            <Button
              style={{ marginTop: "20px" }}
              onClick={navigateToTeams}
              variant="info"
            >
              TeamPage
            </Button>
            <Button
              style={{ marginTop: "20px" }}
              onClick={logoutAll}
              variant="danger"
            >
              LOGOUT ALL!!!
            </Button>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default ShowMasterPage;

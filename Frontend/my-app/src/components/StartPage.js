import React, { useEffect, useState, useRef } from "react";
import {
  Dropdown,
  Button,
  InputGroup,
  Form,
  Card,
  Container,
  Image,
} from "react-bootstrap";
import "../layout/StartPage.css";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import { setPlayer } from "../slices/LoginPlayerSlice";
import Navigation from "./Navigation";
import useSound from "use-sound";
import { NumberFormatter } from "@mantine/core";
import "../layout/scrollbar.css";
import tom1 from "../images/tom3.jpg";
import jan1 from "../images/jan3.jpg";
import tim1 from "../images/tim1.jpg";
import dana1 from "../images/dana1.jpg";
import noPic1 from "../images/noPic1.jpg";
import chris1 from "../images/chris2.jpg";
import ReactPlayer from "react-player";
import { soundGif } from "./StreamingPage";
const server = process.env.REACT_APP_API_SERVER;

const StartPage = () => {
  const dispatch = useDispatch();
  const userID = useSelector((state) => state.loginPlayer.userID);
  const token = useSelector((state) => state.loginPlayer.token);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [stats, setStats] = useState([]); // spieler daten, userID, punkte, etc.
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const [buzzerPressedBy, setBuzzerPressedBy] = useState(null);
  const [allPoints, setAllPoints] = useState([]);
  const [frage, setFrage] = useState();
  const [fragenIndex, setFragenIndex] = useState(1);
  const [kategorie, setKategorie] = useState();
  const [assets, setAssets] = useState();
  const buttonRef = useRef(null);
  const inputRef = useRef(null); // Ref für das Eingabefeld
  const [isReady, setIsReady] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [assetIndex, setAssetIndex] = useState(0);
  let timer = useRef(0);

  // Sound
  const volumeRef = useRef(0.5); // Verwenden Sie useRef für die volume-Variable
  const [sliderValue, setSliderValue] = useState(volumeRef.current); // Zustand für den Slider-Wert

  // reactplayer variables
  const playerVolumeRef = useRef(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [playerSliderValue, setPlayerSliderValue] = useState(
    playerVolumeRef.current
  );
  const videoPlayerRef = useRef(null);
  // Sound functions
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

  const handleSelectPlayer = (eventKey) => {
    console.log("selectedPlayer: " + eventKey);
    setSelectedPlayer(eventKey);
  };
  const setLogIn = () => {
    if (socket) {
      // Sende die Nachricht an den Server
      console.log("login wird gesendet");
      socket.emit("sendLogIn", { userID: userID, loggedIn: true });
    }
  };
  useEffect(() => {
    const newSocket = io(`ws://${server}:8080`);

    newSocket.on("connect", () => {
      console.log("WebSocket-Verbindung hergestellt");
      console.log("login wird gesendet");
      newSocket.emit("sendLogIn", { userID: userID, loggedIn: true });
    });
    // sound
    newSocket.on("sounds", (soundFile) => {
      console.log("sounds bekommen");
      localStorage.setItem("buzzerSound", soundFile.buzzerSound);
      localStorage.setItem("rightSound", soundFile.rightSound);
      localStorage.setItem("falseSound", soundFile.falseSound);
      localStorage.setItem("releaseSound", soundFile.releaseSound);
    });

    // Hier kannst du auf eingehende Nachrichten reagieren
    newSocket.on("message", (message) => {
      console.log(`Nachricht empfangen: ${message}`);
    });
    // Logout
    newSocket.on("logOutAll", () => {
      dispatch(setPlayer({ loggedIn: false }));
    });
    // Logout
    newSocket.on("logOutPlayer", (body) => {
      if (body.userID === userID) dispatch(setPlayer({ loggedIn: false }));
    });
    // Buzzer wurde von jemand anderem gedrückt
    newSocket.on("buzzerPressed", (playerID) => {
      setBuzzerPressed(true);
      setBuzzerPressedBy(playerID);
      playStoredSound("buzzerSound");
      console.log(`Startpage Buzzer pressed by: ${playerID}`);
    });
    //  buzzer wurde wieder freigegeben
    newSocket.on("buzzerReleased", () => {
      setBuzzerPressed(false);
      setBuzzerPressedBy(null);
      //   console.log(`Startpage Buzzer got released`);
    });
    newSocket.on("buzzerReleasedWithTimer", (body) => {
      setBuzzerPressed(false);
      setBuzzerPressedBy(null);
      setTimer(body);

      // console.log(`Startpage Buzzer got released`);
    });
    newSocket.on("buzzerReleasedFree", () => {
      setBuzzerPressed(false);
      setBuzzerPressedBy(null);
      playStoredSound("releaseSound");
    });

    // frage anzeigen
    newSocket.on("showQuestion", (body) => {
      console.log("assets start", JSON.stringify(body.assets));
      setFrage(body.frage);
      setFragenIndex(parseInt(body.fragenIndex));
      setAssets(body.assets);
      setAssetIndex(body.assetIndex);
    });
    newSocket.on("hideQuestion", (body) => {
      setFrage();
      setKategorie(body.kategorie);
      setFragenIndex(parseInt(body.fragenIndex));
      setAssets(body.assets);
      handleCheckBoxUnready();
    });

    // UpdatePlayers
    newSocket.on("UpdatePlayers", (playerPoints, players, answer) => {
      setAllPoints(players);
      if (answer === null) {
        return;
      } else if (answer) {
        playStoredSound("rightSound");
      } else {
        playStoredSound("falseSound");
      }
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
  const setTimer = (body) => {
    if (body.userID === userID) {
      setTimerRunning(true);
      setTimeout(() => {
        // Aktion ausführen, wenn der Timer abgelaufen ist
        setTimerRunning(false);
        console.log("ausgeführt");
      }, body.timeout);
    }
  };

  const sendMessage = () => {
    console.log("Message war: " + inputMessage); // statt console dann bei showMaster anzeigen
    // Überprüfe, ob die Socket.IO-Instanz vorhanden ist
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendMessage", {
        userID: userID,
        inputMessage: inputMessage,
      });
      // Leere das Eingabefeld
    }
  };
  const sendBuzzer = () => {
    if (socket) {
      // Sende die Nachricht an den Server
      socket.emit("sendBuzzerPressed", userID);
    }
  };
  const handleChange = (e) => {
    const { value } = e.target;
    // Führe beide Aktionen aus
    setInputMessage(value);
    sendMessage();
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!e.shiftKey) {
        e.preventDefault(); // Verhindert das Standardverhalten der Enter-Taste
        sendMessage(); // Sendet die Nachricht
      }
    }
    if (!isInputFocused && e.keyCode === 32) {
      // Überprüfung, ob die gedrückte Taste die Leertaste ist und das Button-Element vorhanden ist
      e.preventDefault(); // Standardaktion der Leertaste unterdrücken
      buttonRef.current.click(); // Klicken Sie auf das Button-Element
    }
  };

  useEffect(() => {
    // Ereignislistener für Tastendruck hinzufügen
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      // Ereignislistener beim Komponentenabbau entfernen
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Leerer Abhängigkeitsarray, um sicherzustellen, dass der Effekt nur einmalig ausgeführt wird

  // leertaste buzzern
  // Funktion, um den Button den Fokus zu geben
  const focusButton = () => {
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  };
  const handleClickOutside = () => {
    // Textfeld hat den Fokus verloren
    focusButton(); // Button den Fokus geben
  };

  const isInputFocused = () => {
    return inputRef.current === document.activeElement;
  };
  // ready Handler
  const handleCheckBoxClick = () => {
    const checkBox = document.getElementById("readyCheckbox");
    if (checkBox) {
      checkBox.checked = !checkBox.checked;
      setIsReady(checkBox.checked);
      if (socket) {
        // Sende die Nachricht an den Server
        socket.emit("sendReadyChange", { userID: userID, isReady: isReady });
      }
    }
  };
  const handleCheckBoxUnready = () => {
    const checkBox = document.getElementById("readyCheckbox");
    if (checkBox) {
      checkBox.checked = false; // Checkbox programmgesteuert aktivieren
      setIsReady(false);
      if (socket) {
        // Sende die Nachricht an den Server
        // console.log("handleCheckBoxUnready", isReady)
        socket.emit("sendReadyChange", { userID: userID, isReady: false });
      }
    }
  };
  useEffect(() => {
    if (socket) {
      // Sende die Nachricht an den Server
      console.log("handleCheckBoxUnready", isReady);
      socket.emit("sendReadyChange", { userID: userID, isReady: isReady });
    }
  }, [isReady]);

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
  const adjustPlayerVolume = (e) => {
    playerVolumeRef.current = parseFloat(e.target.value);
    setPlayerSliderValue(playerVolumeRef.current);
  };
  return (
    <div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        value={sliderValue} // Verwenden Sie den Zustand für den Slider-Wert
        onChange={(e) => adjustVolume(e)}
      />{" "}
      ES FUNKTIONIERT JETZT!
      <div className="text-center" onClick={handleClickOutside}>
        <div className="d-flex justify-content-center align-items-center">
          <Card
            bg="dark"
            border="secondary"
            style={{
              fontSize: "30px",
              padding: "10px 10px",
              marginBottom: "20px",
              marginTop: "20px",
            }}
          >
            <Card.Body>
              <Card.Title className="text-center" style={{ fontSize: "35px" }}>
                <h3>
                  Frage {fragenIndex + 1} ({kategorie}):
                </h3>
                <p>{frage}</p>
              </Card.Title>
            </Card.Body>
          </Card>
        </div>
      </div>
      <div
        className="d-flex justify-content-center align-items-center"
        onClick={handleClickOutside}
      >
        <Button
          ref={buttonRef} // Ref dem Button-Element zuweisen
          variant="danger"
          style={{
            fontSize: "120px",
            padding: "10px 20px",
            marginBottom: "20px",
            marginTop: "40px",
            borderRadius: "30px",
            minHeight: "15vh",
            backgroundImage: `url(${
              buzzerPressedBy === "Tom"
                ? tom1
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
          onClick={sendBuzzer}
          disabled={buzzerPressedBy || timerRunning}
        >
          {buzzerPressedBy || "BUZZER!"}
        </Button>
      </div>
      {assets ? (
        <div className="d-flex justify-content-center align-items-center">
          {assets[assetIndex].video || assets[assetIndex].sound ? (
            <div>
              <div
                style={{
                  display: "block",
                  border: "3px solid white",
                  width: "auto",
                  height: "auto",
                }}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={playerSliderValue}
                  onChange={(e) => adjustPlayerVolume(e)}
                />{assets[assetIndex].sound ?
                <Image
                  src={soundGif}
                  style={{ display: "", objectFit: "" }}
                /> : null}
                <ReactPlayer
                  url={assets[assetIndex].video || assets[assetIndex].sound}
                  playing={isPlaying}
                  controls={false}
                  loop={true}
                  width="900px"
                  height="400px"
                  volume={playerVolumeRef.current}
                  ref={(p) => {
                    videoPlayerRef.current = p;
                  }}
                  style={{ display: assets[assetIndex].sound ? "none" : "", border: "3px solid white" }}
                />
              </div>
            </div>
          ) : (
            <Image
              src={assets[assetIndex].bild ? assets[assetIndex].bild : null}
              style={{ width: "40%" }}
            />
          )}
        </div>
      ) : null}
      <div className="d-flex justify-content-center align-items-center">
        <InputGroup style={{ width: "900px", height: "150px" }}>
          <div
            id="checkBox"
            onClick={handleCheckBoxClick}
            style={{
              cursor: "pointer",
              marginRight: "2vw",
              border: isReady ? "2px solid green" : "2px solid black",
            }}
            className="my-auto"
          >
            <InputGroup.Text
              htmlFor="readyCheckbox"
              style={{ cursor: "pointer" }}
            >
              Ready?
            </InputGroup.Text>
            <InputGroup.Checkbox
              onClick={handleCheckBoxClick}
              id="readyCheckbox"
              className="mx-auto"
            />
          </div>
          <Form.Control
            ref={inputRef}
            as="textarea"
            value={inputMessage}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            placeholder="Nachricht eingeben"
            // onInput={(e) => formatInput(e.target)}
          />
          <Button
            onClick={sendMessage}
            disabled={inputMessage === "" ? true : false}
          >
            Nachricht senden
          </Button>
        </InputGroup>
      </div>
      <div
        className="d-flex flex-wrap justify-content-center align-items-center"
        style={{ gap: "10px" }}
        onClick={handleClickOutside}
      >
        {allPoints.map((player) => (
          <div key={player.userID}>
            <Card
              bg="dark"
              border={player.isReady ? "success" : "secondary"}
              //   style={{
              //
              //     marginTop: "30px",
              //     borderRadius: "20px",
              //
              //   }}
              style={{
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
                    : player.userID === "Chris"
                    ? chris1
                    : noPic1
                })`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                marginTop: "2vh",
                width: "18vw",
                minHeight: "25vh",
              }}
            >
              <Card.Img variant="top" />
              <Card.Body>
                <Card.Title
                  style={{ fontSize: "30px" }}
                  className="d-flex justify-content-between align-items-center flex-wrap pointText"
                >
                  <div>{player.userID}:</div>
                  <div>{player.currentPoints} p</div>
                </Card.Title>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
      <Navigation />
    </div>
  );
};

export default StartPage;

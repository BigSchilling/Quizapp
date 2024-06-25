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
import { useDispatch, useSelector } from "react-redux";
import socket from "../websockets/socketInstance";
import { setPlayer } from "../../slices/LoginPlayerSlice";
import Navigation from "../Navigation";
import styles from "./Page.module.css";
import Webcam from "react-webcam";
import useTSRemoteApp from "../../TS5-RemoteAPI/index.ts";
import "../../layout/scrollbar.css";
import tom1 from "../../images/tom3.jpg";
import jan1 from "../../images/jan3.jpg";
import tim1 from "../../images/tim1.jpg";
import dana1 from "../../images/dana1.jpg";
import noPic1 from "../../images/noPic1.jpg";
import chris1 from "../../images/chris2.jpg";
import ReactPlayer from "react-player";
import { soundGif } from "../StreamingPage";
const server = process.env.REACT_APP_API_SERVER;
const infosStructure = ["Pot", "Frage", "Hinweis1", "Hinweis2", "Antwort"];
export default function QuizPokerStream() {
  const dispatch = useDispatch();
  const userID = useSelector((state) => state.loginPlayer.userID);
  const [players, setPlayers] = useState([
    { userID: "Jan", chips: "2000" },
    { userID: "Dana" },
    { userID: "Tom" },
    { userID: "Tim" },
  ]); // userID and chips
  const [infos, setInfos] = useState([
    "Frage",
    "Hinweis 1",
    "Hinweis 2",
    "Antwort",
  ]);
  const [pot, setPot] = useState([0]); // pott and possible side pott
  const [playerMessages, setPlayerMessages] = useState({ Dana: "200" });
  const [deviceId, setDeviceId] = useState(null);
  // teamspeak
  const talkingNames = useRef([]);
  const talkingMap = useRef(new Map());
  const [talkingMap2, setTalkingmap] = useState([]);
  var playerChris = useRef({});
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
  // Sound
  const volumeRef = useRef(0.5); // Verwenden Sie useRef für die volume-Variable
  const [sliderValue, setSliderValue] = useState(volumeRef.current); // Zustand für den Slider-Wert
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
    socket.on("UpdateQuizPokerChips", (players, pot) => {
      setPlayers(players); // spieler punkte und antwort
      setPot(pot); // pot aus gesamten gesetzten chips
    });
    socket.on("UpdateQuizPokerInfos", (infos) => {
      // fragen, hinweiese antwort
      setInfos(infos);
    });
    socket.on("message", (message) => {
      const { userID, inputMessage } = message;

      // Aktualisiere die Nachrichten für den entsprechenden Benutzer
      setPlayerMessages((prevMessages) => ({
        ...prevMessages,
        [userID]: parseInt(inputMessage),
      }));
    });
    socket.on("UpdatePlayers", (playerPoints, players, answer) => {
      setPlayers(players);
    });
    return () => {};
  }, [socket]);
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
  return (
    <div className={styles.container}>
      <Card className={styles.Info}>
        <div>{pot}</div>
        {infos.map((info, index) => (
          <div className={styles[infosStructure[index + 1]]}> {info}</div>
        ))}
      </Card>
      {players.map((player, index) => (
        <div className={styles[player.userID]} key={index}>
          <Card
            bg="dark"
            key={index}
            border={
              talkingMap2.includes(player.tsName)
                ? "info"
                : player.isReady
                ? "danger"
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
                <div>{player.userID}</div>
                <div>{playerMessages[player.userID]}</div>
                <div>{player.chips}</div>
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
            </Card.Body>
          </Card>
        </div>
      ))}
      <div className={styles["Chris"]}>
      <div
        className={styles.webcamcontainer}
        style={{
          borderRadius: "20px",
          overflow: "hidden",
          width: "auto",
          height: "100%",
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
          style={{ backgroundColor: "rgba(0, 0, 0, 1)", maxHeight: "100%" }}
        >
          <Card
            key={5}
            border={
              talkingMap2.includes(playerChris.current.tsName)
                ? "info"
                : playerChris.current.isReady
                ? "dangers"
                : "secondary"
            }
            style={{
              borderWidth: "7px",
              borderRadius: "20px",
              overflowY: "hidden",
              height: "25%", // Anpassen der Höhe nach Bedarf
              width: "50%",
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
                className="d-flex justify-content-between align-items-center flex-wrap miniText"
              >
                <div>{playerChris.current.userID}</div>
                <div>{playerMessages[playerChris.current.userID]}</div>
                <div>{playerChris.current.chips}</div>
              </Card.Title>
            </Card.Body>
          </Card>
        </div>
      ) : null}
    </div>
    </div>
  );
}

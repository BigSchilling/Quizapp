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
export default function Playerpage() {
  const dispatch = useDispatch();
  const userID = useSelector((state) => state.loginPlayer.userID);
  const [players, setPlayers] = useState([]); // userID and chips
  const [infos, setInfos] = useState([""]);
  const [pot, setPot] = useState([0]); // pott and possible side pott
  const [chips, setChips] = useState([0]);
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
        setPot(pot) // pot aus gesamten gesetzten chips
      });
      socket.on("UpdateQuizPokerInfos", (infos) => { // fragen, hinweiese antwort
        setInfos(infos)
      });
  
    return () => {
      
    }
  }, [socket])
  
  return (
    <div className={styles.container}>
       {players.map((player) => (
          <div key={player.userID} className={styles[player.userID]}>
            <Card
              bg="dark"
              border={player.isReady ? "success" : "secondary"}
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
  );
}

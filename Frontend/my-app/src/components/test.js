import React, { useState, useEffect, useRef } from "react";
import useSound from "use-sound";
import io from "socket.io-client";
import ReactPlayer from "react-player";
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
const server = process.env.REACT_APP_API_SERVER;
const TestPage = () => {
  const buzzerSound = "../SoundFiles/ding.mp3";
  const [play] = useSound(buzzerSound);
  const volumeRef = useRef(0.5); // Verwenden Sie useRef für die volume-Variable
  const [sliderValue, setSliderValue] = useState(volumeRef.current); // Zustand für den Slider-Wert

  const handlePlaySound = () => {
    play({ volume: volumeRef.current }); // Verwenden Sie die aktuelle volume-Referenz
  };

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

  useEffect(() => {
    const newSocket = io(`ws://${server}:8080`);

    newSocket.on("connect", () => {
      console.log("WebSocket-Verbindung hergestellt");
      newSocket.emit("sendLogIn", { userID: "test", loggedIn: true });
    });

    newSocket.on("sounds", (soundFile) => {
      console.log("sounds bekommen");
      localStorage.setItem("buzzerSound", soundFile.buzzerSound);
      localStorage.setItem("rightSound", soundFile.rightSound);
      localStorage.setItem("falseSound", soundFile.falseSound);
      localStorage.setItem("releaseSound", soundFile.releaseSound);
    });

    newSocket.on("buzzerReleasedFree", () => {
      playStoredSound("releaseSound");
    });
    newSocket.on("buzzerPressed", (playerID) => {
      playStoredSound("buzzerSound");
    });
    return () => {
      newSocket.disconnect();
    };
  }, [server]);

  const adjustVolume = (e) => {
    volumeRef.current = parseFloat(e.target.value); // Aktualisieren Sie die volume-Referenz
    setSliderValue(volumeRef.current); // Aktualisieren Sie den Zustand des Sliders
  };

  return (
    <div>
      <button onClick={() => playStoredSound("releaseSound")}>
        Play Sound
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={sliderValue} // Verwenden Sie den Zustand für den Slider-Wert
        onChange={(e) => adjustVolume(e)}
      />
      <div
        style={{
          display: "block",
          border: "3px solid white",
          width: "900px",
          height: "700px",
        }}
      >
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Test-Logo.svg/783px-Test-Logo.svg.png"
          style={{ display: "block", objectFit:"" }}
        />
        <ReactPlayer
          url="https://www.youtube.com/watch?v=OtZ11ui_TB8&pp=ygUJd2Fzc2VyZWlz" // Beispiel-URL, ersetzen Sie dies durch die URL Ihres Videos
          playing={false} // Verhindert das Anzeigen des Titels
          controls={true} // Gibt den Benutzern die Kontrolle über das Video
          width="900px" // Setzt die Breite des Videos auf 100%
          height="700px" // Setzt die Höhe des Videos auf 100%
          volume={volumeRef.current}
          style={{ display: "none", border: "3px solid white" }} // Fügt eine weiße Border hinzu
        />
      </div>
    </div>
  );
};

export default TestPage;

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
import socket from "./ShowMasterSocket.js";
const server = process.env.REACT_APP_API_SERVER;
const ShowMasterPlayer = () => {
  const playerVolumeRef = useRef(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [playerSliderValue, setPlayerSliderValue] = useState(
    playerVolumeRef.current
  );
 
  const videoPlayerRef = useRef(null);

  useEffect(() => {
    socket.on("reactPlayerControls", (body) => {
      if (body.isPlaying) setIsPlaying(body.isPlaying);
      if (body.seekTime) {
        console.log("in body seekTime")
        handleSeekToTime3(body.seekTime);}
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const adjustPlayerVolume = (e) => {
    playerVolumeRef.current = parseFloat(e.target.value);
    setPlayerSliderValue(playerVolumeRef.current);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
 

  const handleSeekToTime3 = (totalSeconds) => {
    // const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
    console.log("gesetzt durch socket")
    if (!isNaN(totalSeconds) && videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(totalSeconds);
    }
  };
  return (
    <div>
      <div
        style={{
          display: "block",
          border: "3px solid white",
          width: "auto",
          height: "auto",
        }}
      >
        <Button onClick={handlePlayPause}>
          {" "}
          {isPlaying ? "Pause         Video" : "Play Video"}
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
          // key={seekTime} // Schlüssel für die Neu-Rendern des Videos beim Ändern der Seek-Position
          url="https://youtu.be/OtZ11ui_TB8?t=39"
          playing={isPlaying}
          controls={true}
          loop={true}
          width="80%"
          height="80%"
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
          {/* <Button onClick={sendSeekToTime}>Seek</Button> */}
        </Form>
      </div>
    </div>
  );
};

export default ShowMasterPlayer;

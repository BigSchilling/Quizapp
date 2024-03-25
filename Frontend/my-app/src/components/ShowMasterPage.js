import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dropdown, Button, Card, ListGroup, Container, Row, Col, Form } from "react-bootstrap";
import { createPlayerTrue, createPlayerFalse, setRightPoints, setManuellPoints } from '../slices/ShowMasterSlice';
import io from 'socket.io-client';
import FragenData from '../questionsCatalog/folge3.json'; // datei mit fragen
import useSound from 'use-sound';
import "../layout/scrollbar.css"
const server = process.env.REACT_APP_API_SERVER;

const ShowMasterPage = () => {
    const dispatch = useDispatch();
    const [inputMessage, setInputMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const isHost = useSelector(state => state.loginPlayer.isHost)
    const [buzzerPressed, setBuzzerPressed] = useState(false);
    const [buzzerPressedBy, setBuzzerPressedBy] = useState(null);
    const [allPoints, setAllPoints] = useState([]) // punkte von allen spieler
    const [sortedPoints, setSortedPoints] = useState([]); // punkte sortiert
    const rightPointsValue = useSelector(state => state.showMaster.rightPoints) // wert von plus punkten für richtige antwort
    const wrongPointsValue = useSelector(state => state.showMaster.wrongPoints)
    const [playerMessages, setPlayerMessages] = useState({}); // Nachrichten für jeden Spieler
    const [editMode, setEditMode] = useState(false); // edit mode für karte
    const manuellPoints = useSelector(state => state.showMaster.manuellPoints)
    const [manuellPointsInput, setManuellPointsInput] = useState('');
    const fragen = FragenData.fragen;
    const [fragenIndex, setFragenIndex] = useState(1);
    const [answerToggles, setAnswerToggles] = useState(new Array(fragen[fragenIndex].antworten.length).fill(false));
    const [showQuestion, setShowQuestion] = useState(false);

    // Sound
    const [volume, setVolume] = useState(0.3);
    const [playSound, { error }] = useSound('/pfad/zur/sounddatei.mp3', { volume: 1 });

    useEffect(() => {
        if (error) {
            console.error('Fehler beim Abspielen des Sounds:', error);
        }
    }, [error]);
    const playStoredSound = (soundFile) => {
        const base64Sound = localStorage.getItem(soundFile);
        if (base64Sound) {
            // Base64-String in einen ArrayBuffer umwandeln
            const arrayBuffer = Uint8Array.from(atob(base64Sound), c => c.charCodeAt(0)).buffer;

            // Neue Audioquelle erstellen
            const audio = new Audio();

            // Audioquelle aus dem ArrayBuffer laden
            audio.src = URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/mp3' }));
            audio.volume = volume;
            // Audio abspielen
            audio.play();
        }
    };

    useEffect(() => {
        const newSocket = io(`ws://${server}:8080`);

        newSocket.on('connect', () => {
            console.log('WebSocket-Verbindung hergestellt');
            newSocket.emit('sendLogIn', { isHost: isHost });
        });
        // sound setzen
        newSocket.on('sounds', (soundFile) => {
            console.log('sounds bekommen');
            localStorage.setItem('buzzerSound', soundFile.buzzerSound);
            localStorage.setItem('rightSound', soundFile.rightSound);
            localStorage.setItem('falseSound', soundFile.falseSound);
            localStorage.setItem('releaseSound', soundFile.releaseSound);
        });

        // Hier kannst du auf eingehende Nachrichten reagieren
        newSocket.on('message', (message) => {
            const { userID, inputMessage } = message;

            // Aktualisiere die Nachrichten für den entsprechenden Benutzer
            setPlayerMessages(prevMessages => ({
                ...prevMessages,
                [userID]: inputMessage
            }));
        });
        // Buzzer wurde von jemand anderem gedrückt
        newSocket.on('buzzerPressed', (playerID) => {
            setBuzzerPressed(true)
            setBuzzerPressedBy(playerID)
            playStoredSound("buzzerSound")
        });
        //  buzzer wurde wieder freigegeben
        newSocket.on('buzzerReleased', () => {
            setBuzzerPressed(false)
            setBuzzerPressedBy(null)
        });
        // buzzer ohne punkte freigegeben
        newSocket.on('buzzerReleasedFree', () => {
            setBuzzerPressed(false)
            setBuzzerPressedBy(null)
            playStoredSound("releaseSound")
        });

        //  punkte werden verändert
        newSocket.on('pointsChanged', (points) => {
            setAllPoints(points)
            console.log(`punkte wurden verändert`);
        });
        // UpdatePlayers
        newSocket.on('UpdatePlayers', (playerPoints, players) => {
            setAllPoints(players)
        });
        setSocket(newSocket);

        return () => {
            // Schließe die WebSocket-Verbindung beim Komponentenabbau
            newSocket.disconnect();
        };
    }, [server]);

    const sendMessage = () => {

        console.log("Message war: " + inputMessage) // statt console dann bei showMaster anzeigen 
        // Überprüfe, ob die Socket.IO-Instanz vorhanden ist
        if (socket) {
            // Sende die Nachricht an den Server
            socket.emit('sendMessage', inputMessage);
        }
    };

    const sendBuzzerReleasedFree = () => {
        if (socket) {
            // Sende die Nachricht an den Server
            socket.emit('sendBuzzerReleasedFree', null);

        }
    }
    const sendBuzzerReleased = () => {
        if (socket) {
            // Sende die Nachricht an den Server
            socket.emit('sendBuzzerReleased', null);
        }
    }
    const handleChange = (e) => {
        const { value } = e.target;
        // Führe beide Aktionen aus
        setInputMessage(value);
        sendMessage();
    };
    const setCreatePlayer = () => {
        dispatch(createPlayerTrue())
    }
    const logoutAll = () => {
        if (socket) {
            // Sende die Nachricht an den Server
            socket.emit('sendLogOutAll', { loggedIn: false });
        }
    }
    const rightPoints = () => {
        sendBuzzerReleased()
        if (socket) {
            console.log("rightPoints gedrückt")
            socket.emit("sendRightPoints", { userID: buzzerPressedBy, rightPoints: manuellPoints })
            playStoredSound("rightSound")
        }
    }
    const wrongPoints = () => {
        sendBuzzerReleased()
        if (socket) {
            console.log("wrong Points gedrückt")
            socket.emit("sendWrongPoints", { userID: buzzerPressedBy, wrongPoints: wrongPointsValue })
            playStoredSound("falseSound")
        }
    }
    const changeRightPoints = (value) => {
        dispatch(setRightPoints({ rightPoints: value }))
    }
    useEffect(() => {
        const sortedPoints = [...allPoints].sort((a, b) => b.currentPoints - a.currentPoints);
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
            socket.emit('sendNewSession');
        }
    }

    const changePoints = (userID, value) => {
        const manuellPointsValue = value * manuellPoints
        if (socket) {
            // Sende die Nachricht an den Server
            socket.emit('sendChangePoints', { userID: userID, manuellPoints: manuellPointsValue });
        }
    }
    const setManuellPointsOnChange = (e) => {
        const { value } = e.target;
        setManuellPointsInput(value); // Wert des Eingabefelds speichern
        dispatch(setManuellPoints({ manuellPoints: value })); // Manuell Punkte ändern
    }
    const setAnswerToggleButton = (index) => {
        setAnswerToggles(prevToggles => {
            const newToggles = [...prevToggles];
            newToggles[index] = !newToggles[index];
            return newToggles;
        });
    };
    const changeFragenIndex = (value) => {
        const newValue = fragenIndex + value;
        if (newValue >= 0 && newValue < fragen.length) {
            resetShowQuestion(newValue)
            resetAnswerToggles();
            setFragenIndex(newValue)
            const frage = fragen[newValue].frage
            const kategorie = fragen[newValue].kategorie
            socket.emit('sendStreamingQuestion', { frage: frage, fragenIndex: newValue, kategorie: kategorie });
        }
    }
    const resetAnswerToggles = () => {
        setAnswerToggles(new Array(fragen[fragenIndex].antworten.length).fill(false));
    };

    const changeShowQuestion = () => {
        setShowQuestion(true)
        if (socket) {
            const frage = fragen[fragenIndex].frage
            const value = fragenIndex
            const kategorie = fragen[value].kategorie
            socket.emit('sendShowQuestion', { frage: frage, fragenIndex: value, kategorie: kategorie });
        }
    };
    const changeHideQuestion = () => {
        setShowQuestion(false)
        if (socket) {
            socket.emit('sendHideQuestion', { fragenIndex: fragenIndex, kategorie: fragen[fragenIndex].kategorie });
        }
    };
    const resetShowQuestion = (index) => {
        setShowQuestion(false)
        if (socket) {
            socket.emit('sendHideQuestion', { fragenIndex: index, kategorie: fragen[index].kategorie });
        }
    }
    var maxHeightVar = "8rem";
    return (
        <div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
            <Container>
                <div className="d-flex justify-content-center align-items-center">
                    <Button variant="primary" style={{ width: 'fit-content', marginRight: "40px" }} onClick={() => changeFragenIndex(-1)}>
                        {"vorherige Frage"}
                    </Button>
                    <div className="text-center">
                        <Card bg="dark" border="secondary" style={{ fontSize: '30px', padding: '10px 10px', marginBottom: '40px', marginTop: '40px' }} >
                            <Card.Body>
                                <Card.Title className="text-center" style={{ fontSize: '35px' }}>
                                    <h3>Frage {fragenIndex + 1} ({fragen[fragenIndex].kategorie}):</h3>
                                    <p>{fragen[fragenIndex].frage}</p>
                                </Card.Title>
                            </Card.Body>
                        </Card>
                    </div>
                    <Button variant="primary" style={{ width: 'fit-content', marginLeft: "40px" }} onClick={() => changeFragenIndex(1)}>
                        {"nächste Frage"}
                    </Button>
                </div>
                <div className="text-center">

                    <Button
                        variant={showQuestion ? "dark" : "secondary"}
                        style={{ marginBottom: "20px", marginTop: "-10px" }}
                        onClick={showQuestion ? changeHideQuestion : changeShowQuestion}>
                        {!showQuestion ? "Frage anzeigen" : "Frage angezeigt"}
                    </Button>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center', // Zentriert horizontal
                        alignItems: 'center', // Zentriert vertikal
                        gap: '20px', // Abstand zwischen den Buttons
                    }}>
                        {fragen[fragenIndex].antworten.map((antwort, antwortIndex) => (
                            <Button
                                key={antwortIndex}
                                variant={answerToggles[antwortIndex] ? "success" : "dark"}
                                style={{ fontSize: '20px' }}
                                onClick={() => setAnswerToggleButton(antwortIndex)}
                            >
                                {antwort}
                            </Button>
                        ))}
                    </div>
                </div>

            </Container>
            <div className="d-flex flex-column align-items-center">
                <Button
                    variant={!buzzerPressed? "primary":"info"}
                    style={{ fontSize: '80px', padding: '10px 20px', marginBottom: '20px', marginTop: '40px' }}
                    onClick={null}
                    // disabled={buzzerPressed}
                >
                    {buzzerPressedBy || "BUZZER!"}
                </Button>
                {buzzerPressed ? (
                    <div className="d-flex justify-content-center align-items-center">
                        <Button
                            variant="danger"
                            style={{ fontSize: '50px', padding: '10px 20px', marginBottom: '20px', marginRight: '20px' }}
                            onClick={wrongPoints}
                        >
                            {"Falsch"}
                        </Button>
                        <Button
                            variant="success"
                            style={{ fontSize: '50px', padding: '10px 20px', marginBottom: '20px' }}
                            onClick={rightPoints}
                        >
                            {"Richtig!"}
                        </Button>
                    </div>
                ) : null}



                <Button
                    variant="warning"
                    style={{ fontSize: '30px', padding: '10px 20px', marginBottom: '40px', marginTop: '40px' }}
                    onClick={sendBuzzerReleasedFree}>
                    {"freigeben"}
                </Button>
            </div>


            <div>
                <Container id="UserManagementPageListComponent">
                    <Row xs={1} md={2} lg={4} xl={4} className="justify-content-center align-items-center ">
                        {sortedPoints.map(player => (
                            <Col key={player.userID} className="mb-3">
                                <Card bg="dark" border={!player.isReady ? "success" : 'secondary'} style={{ width: '18rem', maxHeight: '1000px', overflowY: 'auto' }}>
                                    <Card.Body className="d-flex flex-column" style={{ minHeight: '100%', paddingBottom: '10px' }}>
                                        <Card.Title style={{ fontSize: '30px' }} className="d-flex justify-content-between align-items-center flex-wrap">
                                            <div>
                                                {player.userID}:
                                            </div>
                                            <div>
                                                {player.currentPoints} p
                                            </div>
                                        </Card.Title>
                                        <Card.Title
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Button
                                                variant='danger'
                                                onClick={() => changePoints(player.userID, -1)}
                                                style={{ width: '50%', marginRight: '5px' }} // Breite auf 50% des verfügbaren Platzes setzen
                                            >
                                                minus
                                            </Button>

                                            <Button
                                                variant='success'
                                                onClick={() => changePoints(player.userID, 1)}
                                                style={{ width: '50%', marginLeft: '5px' }} // Breite auf 50% des verfügbaren Platzes setzen
                                            >
                                                plus
                                            </Button>
                                        </Card.Title>


                                        <div className="d-flex flex-column flex-grow-1 align-items-start" style={{ overflowY: 'auto' }}>
                                            <ListGroup style={{ width: '100%' }}>
                                                <ListGroup.Item bg="secondary" style={{ minHeight: '100px', overflowY: 'auto' }}>
                                                    <textarea
                                                        style={{ width: '100%', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' }}
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
                                        <Button variant="secondary">Edit mode?</Button>
                                    </Card.Body>
                                </Card>

                            </Col>
                        ))}
                    </Row>

                    <div>
                        <div >
                            <Form.Control
                                id="manuellPointsInput"
                                bsClass="test"
                                type="number"
                                value={manuellPoints}
                                onChange={setManuellPointsOnChange}
                                style={{ width: '10px', maxWidth: '10px' }}
                            /> Manuelle Punkte
                        </div>
                        <Button
                            variant="info"
                            style={{ fontSize: '20px', padding: '10px 20px', marginBottom: '20px', marginTop: '20px' }}
                            onClick={newSession}>
                            {"New Session"}
                        </Button>

                        <Button
                            variant="success"
                            style={{ fontSize: '20px', padding: '10px 20px', marginBottom: '40px', marginTop: '40px' }}
                            onClick={setCreatePlayer}>
                            {"Create Player"}
                        </Button>
                        <Button style={{ marginTop: "20px" }} onClick={logoutAll} variant="danger">
                            LOGOUT ALL!!!
                        </Button>
                    </div>

                </Container>
            </div>
        </div>
    );
};

export default ShowMasterPage;

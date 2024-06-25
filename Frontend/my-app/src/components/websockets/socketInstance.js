// socketInstance.js
import io from "socket.io-client";
// import { REACT_APP_API_SERVER_URL } from "./config"; // Stellen Sie sicher, dass Sie die Umgebungsvariable korrekt definieren
const server = process.env.REACT_APP_API_SERVER_URL;
const socket = io(""+server);

export default socket;

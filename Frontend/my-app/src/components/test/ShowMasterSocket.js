// in einer zentralen Datei, z.B. socket.js
import io from "socket.io-client";

const server = process.env.REACT_APP_API_SERVER;
const socket = io(`ws://${server}:8080`);

export default socket;

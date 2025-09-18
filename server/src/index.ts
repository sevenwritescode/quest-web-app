import express from "express";
import { v4 as uuid } from 'uuid';
import path, { dirname } from "path";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { randomBytes } from "crypto"
import cookie from "cookie";
import { fileURLToPath } from "url";
import type { Room } from "./types.ts";
import { roomSocketInit } from "./socket.js";
import { canonicalDecks } from "./data/decks/index.js";

console.log('starting server');

const app = express();
// Determine ports for HTTP (Express) and Socket.IO servers
const PORT = Number(process.env.PORT) || 4000
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.send("OK -- no problems here!");
});

export const rooms: Record<string, Room> = {};

function generateRoomCode(length = 4): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code: string;

  do {
    const bytes = randomBytes(length)
    code = Array.from(bytes)
      .map((b) => alphabet[b % alphabet.length])
      .join("")
  } while (rooms[code])

  return code
}

function getSessionAuth(req: express.Request, res: express.Response): string {
  let sessionAuth = req.cookies.sessionAuth as string;
  if (!sessionAuth) {
    sessionAuth = uuid();
    res.cookie("sessionAuth", sessionAuth, { httpOnly: true });
  }
  return sessionAuth;
}

app.post("/api/create-room", (req, res) => {
  const sessionAuth = getSessionAuth(req, res);
  const roomCode = generateRoomCode();
  const hostId = uuid();
  rooms[roomCode] = {
    server: {
      code: roomCode,
      players: [  ],
      hostId,
      settings: {
        numberOfPlayers: 7,
        deck: canonicalDecks.DirectorsCut7Player
      },
      authToId: { [sessionAuth]: hostId } 
    },
    clients: []
  };
  res.json({ code: roomCode });
});

// TEMP SERVER ENDPOINT
app.get("/api/get-rooms-info", (_req, res) => {
  res.json(rooms);
});

app.get("/api/session", (req, res) => {
  // your existing getSessionAuth will either return an existing
  // cookie value, or set a new one for you.
  const auth = getSessionAuth(req, res);
  res.json({ sessionAuth: auth });
});

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const server = http.createServer(app);
export const io = new Server(server, { path: "/socket.io" });

io.use((socket, next) => {
  const raw = socket.handshake.headers.cookie || "";
  const cookies = cookie.parse(raw);
  let sessionAuth = cookies.sessionAuth;
  
  if (!sessionAuth) {
    socket.emit("error", "Invalid Session Auth");
    return;
  }

  socket.data.sessionAuth = sessionAuth;
  next();
});

io.on("connection", roomSocketInit);

const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath)); 
app.get("/{*catchall}", (_req, res) => {
  getSessionAuth(_req,res);  
  res.sendFile(path.join(clientDistPath, "index.html"));
});

server.listen(PORT, () => {
  console.log(`🚀 HTTP + Websockets on port ${PORT}`)
})




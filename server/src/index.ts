import express, { Router } from "express";
import { v4 as uuid } from 'uuid';
import path, { dirname } from "path";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { randomBytes } from "crypto"
import cookie from "cookie";
import { fileURLToPath } from "url";

const app = express();
// Determine ports for HTTP (Express) and Socket.IO servers
const PORT = Number(process.env.PORT) || 4000
app.use(express.json());
app.use(cookieParser());


app.get("/api/health", (_req, res) => {
  res.send("OK -- no problems here!");
});


export type Player    = { id: string; name?: string }
export type RoomClientState = { code: string, players: Player[], clientId: string, hostId: string }
export type RoomState = { code: string, players: Player[], hostId: string, authToId: Record<string,string>}


const rooms: Record<string, RoomState> = {};


function generateRoomCode(length = 4): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let code: string

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
    code: roomCode,
    players: [  ],
    hostId,
    authToId: { [sessionAuth]: hostId }
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
const io = new Server(server, { path: "/socket.io" });


io.use((socket, next) => {
  const raw = socket.handshake.headers.cookie || "";
  const cookies = cookie.parse(raw);
  let sessionAuth = cookies.sessionAuth;
  
  if (!sessionAuth) {
    // if no cookie, create one just like your HTTP handler does
    const req = socket.request as express.Request
    const res = (req as any).res as express.Response
    sessionAuth = getSessionAuth(req, res)
  }

  socket.data.sessionAuth = sessionAuth;
  next();
});

io.on("connection", (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on("join", ({ code }: { code: string }) => {
    const room = rooms[code];
    console.log(`attempt to join: ${code}`);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    if (!room.authToId[socket.data.sessionAuth]) {
      const id = uuid();
      room.authToId[socket.data.sessionAuth] = id;
    }

    const clientId = room.authToId[socket.data.sessionAuth] as string;

    if (!room.players.some(p => p.id === clientId)) {
      room.players.push({ id: clientId });
    }

    socket.join(code);
    io.to(code).emit("roomState", { players: room.players });
  });
});

if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDistPath));
  app.get("/{*catchall}", (_req, res) => {  
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}


server.listen(PORT, () => {
  console.log(`🚀 HTTP + Websockets on port ${PORT}`)
})




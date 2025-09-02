import express, { Router } from "express";
import { v4 as uuid } from 'uuid';
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { randomBytes } from "crypto"
import cookie from "cookie";

const router = express();
// Determine ports for HTTP (Express) and Socket.IO servers
const HTTP_PORT = Number(process.env.PORT) || 4000;
// const SOCKET_PORT = (Number(process.env.PORT) + 1) || 4001;
router.use(express.json());
router.use(cookieParser());

router.listen(HTTP_PORT, () => {
  console.log(`🚀 Express server listening on http://0.0.0.0:${HTTP_PORT}`);
});

router.get("/api/health", (_req, res) => {
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

router.post("/api/create-room", (req, res) => {
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
router.get("/api/get-rooms-info", (_req, res) => {
  res.json(rooms);
});


const httpServer = http.createServer(router);
const io = new Server(httpServer, { path: "/socket.io" });


io.use((socket, next) => {
  const raw = socket.handshake.headers.cookie || "";
  const cookies = cookie.parse(raw);
  const sessionAuth = cookies.sessionAuth;

  if (!sessionAuth) return next(new Error("Unauthorized - missing sessionAuth"));

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
    io.to(code).emit("lobbyState", { players: room.players });
  });


});

// httpServer.listen(SOCKET_PORT, () => {
//   console.log(`🚀 Socket.IO server listening on http://0.0.0.0:${SOCKET_PORT}`);
// });


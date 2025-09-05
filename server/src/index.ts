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


export type Role = "Spectator"
export type Player       = { id: string; name: string | undefined; Role?: Role, roleKnown: boolean, allegianceKnown: boolean}


export type RoomClientState = {
  code: string,
  players: Player[], 
  clientId: string, 
  hostId: string 
}
export type RoomState = { code: string, players: Player[], hostId: string, authToId: Record<string,string>}

export type Room = { server: RoomState, clients: RoomClientState[] }

const rooms: Record<string, Room> = {};


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
    server: {
      code: roomCode,
      players: [  ],
      hostId,
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
const io = new Server(server, { path: "/socket.io" });


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

function broadcastRoomClientStates(room: Room) {
  for (const player of room.server.players) {
      io.to(player.id).emit("roomStateUpdate", 
        room.clients.find((p) => p.clientId === player.id)
      );
    }
}

io.on("connection", (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on("join", ({ code, name }: { name?: string, code: string }) => {
    const room = rooms[code];
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    if (!room.server.authToId[socket.data.sessionAuth]) {
      const id = uuid();
      room.server.authToId[socket.data.sessionAuth] = id;
    }

    const clientId = room.server.authToId[socket.data.sessionAuth] as string;

    // add new RoomClientState to keep track of client room state for this client
    room.clients.push({ clientId, hostId: room.server.hostId, code, 
      players: room.server.players.map(player => ({ ...player })),
      // note we might relay all room.server.players if spectator's are not supposed to see people's roles
    });

    //validate name, or if invalid, set it to undefined
    if (!isValidName(name)) { name = undefined; }
    if (!existsNameCollision(name,room.server,clientId)) { name = undefined; }

    // add current client to server with full info
    room.server.players.push({ id: clientId, name, Role: "Spectator", roleKnown: true, allegianceKnown: true});
    
    // update all clients of this new player
    for (const client of room.clients) {
      client.players.push( { id: clientId, name, Role: "Spectator", roleKnown: true,
        allegianceKnown: true } );
    }
    
    socket.join([code,clientId]);
    broadcastRoomClientStates(room);
    socket.to(code).emit("logMessage", `${name} joined the room.`);
  });

  // add leave room

  // add kick player from room

  function isValidName(newName: string | undefined) {
    if (newName === undefined) { return true; }
    const validNameRegex = /^(?!\s)(?!.*\s$)[A-Za-z0-9._\s]+$/;
    if (!validNameRegex.test(newName) || newName.length > 20) {
      socket.emit(
        "error",
        "Invalid name: use 1-20 characters (letters, dots, underscores), spaces only between words, no leading/trailing space."
      );
      return false;
    }
    return true;
  }

  function existsNameCollision(newName: string | undefined, room: RoomState, clientId: string) {
    if (newName === undefined) { return true; }
    if (room.players.length === 0) { return true; }
    if (room.players.filter(p => ((p.name === newName) && p.id !== clientId)))
    {
      socket.emit(
        "error",
        "Player Names must be unique: someone else in this lobby already has this name"
      );
      return false;
    }
    return true;
  }

  socket.on("changeName", ({ newName, code }: { newName: string, code: string }) => {
    const room = rooms[code];
    if (!room) {
      socket.emit("error", "Code not associated with room");
      return;
    }
  
    if (!isValidName(newName)) return;

    const clientId = room.server.authToId[socket.data.sessionAuth];
    if (!clientId) { 
      socket.emit("error","Internal Server Error: sessionAuth does not match clientId"); return;
    }
    const player = room.server.players.find((p) => p.id === clientId);

    if (!player) {
      socket.emit("error","Client does not exist in this room")
      return;
    } 

    if (!existsNameCollision(newName,room.server,clientId)) return;
    
    player.name = newName;
    for (const client of room.clients) {
      const playerInClientPlayers = client.players.find((p) => p.id === clientId);
      if (playerInClientPlayers === undefined) {
        socket.emit("error","internal server error: player does not exist in a client's player list");
        return;
      }
      playerInClientPlayers.name = newName;
    }
  });
});


const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath)); 
app.get("/{*catchall}", (_req, res) => {
  getSessionAuth(_req,res);  
  res.sendFile(path.join(clientDistPath, "index.html"));
});



server.listen(PORT, () => {
  console.log(`🚀 HTTP + Websockets on port ${PORT}`)
})




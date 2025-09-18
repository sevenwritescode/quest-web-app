import type { DefaultEventsMap, Socket } from "socket.io";
import type { Deck, Room, RoomServerState } from "./types.ts";
import { io, rooms } from "./index.js";
import { v4 as uuid } from 'uuid';

function validateClient(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  room: Room | undefined
): string {
  if (!room) {
    socket.emit("error", "Code not associated with room");
    return "";
  }
  const clientId = room.server.authToId[socket.data.sessionAuth];
  if (!clientId) {
    socket.emit("error", "Internal Server Error: clientId is not found in room."); 
    return "";
  }
  return clientId;
}

function validateHost(
  socket: Socket<DefaultEventsMap,DefaultEventsMap,DefaultEventsMap,any>,
  room: Room | undefined
): string {
  const clientId = validateClient(socket,room);
  if (!clientId || !room)
  {
    return "";
  }
  if (clientId != room.server.hostId) {
    socket.emit("error", `You are not the host of ${room.server.code}`);
    return "";
  }
  return clientId;
}

/**
 * Validate player display name. Emits error on socket if invalid.
 */
function isValidName(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, newName?: string): boolean {
  if (newName === undefined) return true;
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

/**
 * Check for name collisions in existing room players. Emits error on socket if collision.
 */
function existsNameCollision(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  newName: string | undefined,
  room: RoomServerState,
  clientId: string
): boolean {
  if (newName === undefined) return false;
  if (room.players.length === 0) return false;
  if (room.players.some(p => p.name === newName && p.id !== clientId)) {
    socket.emit(
      "error",
      "Player Names must be unique: someone else in this lobby already has this name."
    );
    return true;
  }
  return false;
}

function isValidPlayerCount(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, count: number) {
  if (!(4 <= count && count <= 10)) {
    socket.emit("error", "Invalid Player Count, must be a value between 4 and 10.");
    return false;
  }
  return true;
}

function removePlayerFromRoom(room: Room, clientId: string) {
  room.server.players = room.server.players.filter((p) => p.id !== clientId);
  room.clients = room.clients.filter((p) => p.clientId !== clientId);
  for (const client of room.clients) {
    client.players = client.players.filter((p) => p.id !== clientId);
  }
}

function clientLeaveRoom(room: Room, clientId: string) {
  removePlayerFromRoom(room,clientId);
  const playerName = room.server.players.find((p) => p.id === clientId)?.name;
  io.to(room.server.code).emit("logMessage",{mes: `${playerName ?? "Anonymous"} left the room.`, color: "red"});
}

function kickClientFromRoom(room: Room, clientId: string) {
  removePlayerFromRoom(room,clientId);
  const playerName = room.server.players.find((p) => p.id === clientId)?.name;
  io.to(room.server.code).emit("logMessage",{mes: `${playerName} kick from room.`, color: "red"});
}

/**
 * Update a player's name in the server and all client states of the room.
 */
function updatePlayerNameInRoom(room: Room, clientId: string, newName: string | undefined) {
  // Update server-side player name
  let prevName;
  const player = room.server.players.find(p => p.id === clientId);
  if (player) {
    prevName = player.name;
    player.name = newName;
  }
  // Update each client's view
  for (const clientState of room.clients) {
    const p = clientState.players.find(p => p.id === clientId);
    if (p) {
      p.name = newName;
    }
  }
  io.to(room.server.code).emit("logMessage",{mes:`${prevName ?? "Anonymous"} changed their name to ${newName}.`, color: "gray"});
}

function updatePlayerCountInRoom(room: Room, count: number) {
  const prevCount = room.server.settings.numberOfPlayers;
  room.server.settings.numberOfPlayers = count;

  for (const clientState of room.clients) { 
    clientState.settings.numberOfPlayers = count;
  }

  io.to(room.server.code).emit("logMessage",{mes: `Player Count for the Room has changed from ${prevCount} to ${count}.`});
} 

function updateDeckInRoom(room: Room, deck: Deck) {
  room.server.settings.deck = deck;
  for (const clientState of room.clients) { 
    clientState.settings.deck = deck;
  }
  io.to(room.server.code).emit("logMessage", { mes: `Host updated Deck`});
}

/**
 * Add a new client into room server and client states.
 */
function addNewClient(room: Room, clientId: string, name?: string) {
  // initialize client view state
  room.clients.push({
    clientId,
    hostId: room.server.hostId,
    code: room.server.code,
    players: room.server.players.map(player => ({ ...player })),
    settings: {
      numberOfPlayers: room.server.settings.numberOfPlayers,
      deck: JSON.parse(JSON.stringify(room.server.settings.deck))
    }
  });
  // add to server players
  room.server.players.push({
    id: clientId,
    name,
    Role: "Spectator",
    roleKnown: true,
    allegianceKnown: true,
  });
  // update existing client views with new player
  for (const clientState of room.clients) {
    clientState.players.push({
      id: clientId,
      name,
      Role: "Spectator",
      roleKnown: true,
      allegianceKnown: true,
    });
  }
}


function broadcastRoomClientStates(room: Room) { 
  for (const player of room.server.players) {
    
    io.to(player.id).emit("roomStateUpdate", 
      room.clients.find((p) => (p.clientId === player.id))
    );
  }
}

export function roomSocketInit (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on("join", ({ code, name }: { name?: string, code: string }) => {
    console.log("player join emit");
    console.log({name,code});
    const room = rooms[code];
    if (!room) {
      socket.emit("disconnect_request", "Room does not exist");
      return;
    }
    if (!room.server.authToId[socket.data.sessionAuth]) {
      const id = uuid();
      room.server.authToId[socket.data.sessionAuth] = id;
    }
    const clientId = room.server.authToId[socket.data.sessionAuth] as string;
    socket.join([code, clientId]);
    // validate name
    if (!isValidName(socket, name)) name = undefined;
    if (existsNameCollision(socket, name, room.server, clientId)) name = undefined;
    // reconnect existing player
    const existingPlayer = room.server.players.find(p => p.id === clientId);
    if (existingPlayer) {
      // change name
      // name !== undefined is to preserve previous name if they are joining from new tab
      if (existingPlayer.name !== name && name !== undefined) {
        updatePlayerNameInRoom(room, clientId, name);
        broadcastRoomClientStates(room);
      }
      // otherwise just update client
      else {
        socket.emit("roomStateUpdate", room.clients.find((p) => (p.clientId === existingPlayer.id)));
      }
      socket.emit("logMessage", {mes: `reconnected to room ${code}`, color: "gray"});
      return;
    }
    // new player
    console.log("person not already in room");
    addNewClient(room, clientId, name);
    broadcastRoomClientStates(room);
    io.to(code).emit(
      "logMessage",
      { mes: `${name === undefined ? "Anonymous" : name} joined the room.`, color: "green"}
    );
  });

  // add leave room
  socket.on("leaveRequest", ({ code }: { code: string }) => {
    const room = rooms[code];
    const clientId = validateClient(socket,room);
    if (!clientId || !room) { return; }
    
    clientLeaveRoom(room,clientId);
    broadcastRoomClientStates(room);
    socket.emit("disconnect_request", `You successfully left room ${room.server.code}`);
  });

  // add kick player from room


  socket.on("changeName", ({ newName, code }: { newName: string, code: string }) => {
    if (!isValidName(socket, newName)) return;

    const room = rooms[code];
    const clientId = validateClient(socket,room);
    if (!clientId || !room) { return; }

    const player = room.server.players.find((p) => p.id === clientId);

    if (!player) {
      socket.emit("error","Client is not a player in this room. (Maybe they left?)")
      return;
    } 

    if (existsNameCollision(socket, newName, room.server, clientId)) return;
    if (player.name === newName) return;
    
    updatePlayerNameInRoom(room, clientId, newName);
    broadcastRoomClientStates(room);
  });

  socket.on("changePlayerCount", ({ count, code }: { count: number, code: string}) => {
    const room = rooms[code];
    const clientId = validateHost(socket,room);
    if (!clientId || !room) { return; }

    if (!isValidPlayerCount(socket,count)) return;
    if (room.server.settings.numberOfPlayers === count) return;

    updatePlayerCountInRoom(room,count);
    broadcastRoomClientStates(room);
  });

  socket.on("changeDeck", ({ deck, code }: { deck: Deck, code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket,room);
    if (!clientId || !room) { return; }
    
    updateDeckInRoom(room, deck);
    broadcastRoomClientStates(room);
  });
}
import type { DefaultEventsMap, Socket } from "socket.io";
import type { Room, RoomState } from "./types.ts";
import { io, rooms } from "./index.js";
import { v4 as uuid } from 'uuid';

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
  room: RoomState,
  clientId: string
): boolean {
  if (newName === undefined) return false;
  if (room.players.length === 0) return false;
  if (room.players.some(p => p.name === newName && p.id !== clientId)) {
    socket.emit(
      "error",
      "Player Names must be unique: someone else in this lobby already has this name"
    );
    return true;
  }
  return false;
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
  io.to(room.server.code).emit("logMessage",{mes:`${prevName ?? "Anonymous"} changed their name to ${newName}`, color: "gray"});
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
      if (existingPlayer.name !== name) {
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

  // add kick player from room


  socket.on("changeName", ({ newName, code }: { newName: string, code: string }) => {
    const room = rooms[code];
    if (!room) {
      socket.emit("error", "Code not associated with room");
      return;
    }
  
    if (!isValidName(socket, newName)) return;

    const clientId = room.server.authToId[socket.data.sessionAuth];
    if (!clientId) { 
      socket.emit("error","Internal Server Error: sessionAuth does not match clientId"); return;
    }
    const player = room.server.players.find((p) => p.id === clientId);

    if (!player) {
      socket.emit("error","Client does not exist in this room")
      return;
    } 

    if (existsNameCollision(socket, newName, room.server, clientId)) return;
    
    const prevName = player.name;
    updatePlayerNameInRoom(room, clientId, newName);
    broadcastRoomClientStates(room);
  });
}
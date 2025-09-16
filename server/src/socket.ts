import type { DefaultEventsMap, Socket } from "socket.io";
import type { Room, RoomState } from "./types.ts";
import { io, rooms } from "./index.js";
import { v4 as uuid } from 'uuid';


function broadcastRoomClientStates(room: Room) { 
  for (const player of room.server.players) {
    
    io.to(player.id).emit("roomStateUpdate", 
      room.clients.find((p) => (p.clientId === player.id))
    );
  }
}

export function roomSocketInit (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  // console.log(`⚡ Socket connected: ${socket.id}`);

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
    if (newName === undefined) { return false; }
    if (room.players.length === 0) { return false; }
    if (room.players.filter(p => ((p.name === newName) && p.id !== clientId)).length !== 0)
    {
      socket.emit(
        "error",
        "Player Names must be unique: someone else in this lobby already has this name"
      );
      return true;
    }
    return false;
  }

  socket.on("join", ({ code, name }: { name?: string, code: string }) => {
    console.log("player join emit");
    const room = rooms[code];
    if (!room) {
      socket.emit("disconnect_request","Room does not exist");
      return;
    }

    if (!room.server.authToId[socket.data.sessionAuth]) {
      const id = uuid();
      room.server.authToId[socket.data.sessionAuth] = id;
    }

    const clientId = room.server.authToId[socket.data.sessionAuth] as string;
    socket.join([code,clientId]);

    //validate name, or if invalid, set it to undefined
    if (!isValidName(name)) { name = undefined; }
    if (existsNameCollision(name,room.server,clientId)) { name = undefined; }
    
    // if person is already in the room, just reconnect them
    if (room.server.players.find((p) => p.id === clientId)) {
      for (const client of room.clients) {
        const playerInClientPlayers = client.players.find((p) => p.id === clientId);
        if (playerInClientPlayers === undefined) {
          socket.emit("error","internal server error: player does not exist in a client's player list");
          return;
        }
        playerInClientPlayers.name = name;
      }
      console.log("person already in room");
      broadcastRoomClientStates(room);
      socket.emit("logMessage", `reconnected to room ${code}`); 
      return;
    }

    console.log("person not already in room");
    

    // add new RoomClientState to keep track of client room state for this client
    room.clients.push({ clientId, hostId: room.server.hostId, code, 
      players: room.server.players.map(player => ({ ...player })),
      // note we might relay all room.server.players if spectator's are not supposed to see people's roles
    });

    // add current client to server with full info
    room.server.players.push({ id: clientId, name, Role: "Spectator", roleKnown: true, allegianceKnown: true});
    
    // update all clients of this new player
    for (const client of room.clients) {
      client.players.push( { id: clientId, name, Role: "Spectator", roleKnown: true,
        allegianceKnown: true } );
    }
    
    broadcastRoomClientStates(room);
    io.to(code).emit("logMessage", `${(name === undefined) ? "Anonymous" : name} joined the room.`);
  });

  // add leave room

  // add kick player from room


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

    if (existsNameCollision(newName,room.server,clientId)) return;
    
    let prevName = player.name;
    player.name = newName;
    for (const client of room.clients) {
      const playerInClientPlayers = client.players.find((p) => p.id === clientId);
      if (playerInClientPlayers === undefined) {
        socket.emit("error","internal server error: player does not exist in a client's player list");
        return;
      }
      playerInClientPlayers.name = newName;
    }
    broadcastRoomClientStates(room);
    io.to(code).emit("logMessage", `${(prevName === undefined) ? "Anonymous" : prevName} changed their name to ${(player.name === undefined) ? "Anonymous" : player.name}.`);
  });
}
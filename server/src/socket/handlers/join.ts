import type { DefaultEventsMap, Socket } from "socket.io";
import { io, rooms } from "../../index.js";
import { v4 as uuid } from 'uuid';
import type { Room } from "../../types.ts";
import { validateClient, isValidName, existsNameCollision } from "../validators.js";
import { addNewClient, broadcastRoomClientStates, updatePlayerNameInRoom } from "../roomService.js";

export function setupJoinHandler(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  socket.on("join", ({ code, name }: { name?: string; code: string }) => {
    const room: Room | undefined = rooms[code];
    if (!room) {
      socket.emit("disconnect_request", "Room does not exist");
      return;
    }
    // assign or retrieve clientId from sessionAuth
    if (!room.server.authToId[socket.data.sessionAuth]) {
      const id = uuid();
      room.server.authToId[socket.data.sessionAuth] = id;
    }
    const clientId = room.server.authToId[socket.data.sessionAuth] as string;
    socket.join([code, clientId]);

    // validate name
    let desiredName = name;
    if (!isValidName(socket, desiredName)) desiredName = undefined;
    if (existsNameCollision(socket, desiredName, room.server, clientId)) desiredName = undefined;

    const existing = room.server.players.find((p) => p.id === clientId);
    if (existing) {
      // update name if changed
      if (existing.name !== desiredName && desiredName !== undefined) {
        updatePlayerNameInRoom(room, clientId, desiredName);
        broadcastRoomClientStates(room);
      } else {
        // send current state
        socket.emit(
          "roomStateUpdate",
          room.clients.find((p) => p.clientId === clientId)
        );
      }
      socket.emit("logMessage", { mes: `reconnected to room ${code}`, color: "gray" });
    } else {
      // new player
      addNewClient(room, clientId, desiredName);
      broadcastRoomClientStates(room);
      io.to(code).emit("logMessage", { mes: `${desiredName ?? "Anonymous"} joined the room.`, color: "green" });
    }
  });
}
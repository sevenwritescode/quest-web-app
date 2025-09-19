import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateClient } from "../validators.js";
import { isValidName, existsNameCollision } from "../validators.js";
import { updatePlayerNameInRoom, broadcastRoomClientStates } from "../roomService.js";

export function setupChangeNameHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("changeName", ({ newName, code }: { newName: string; code: string }) => {
    if (!isValidName(socket, newName)) return;

    const room = rooms[code];
    const clientId = validateClient(socket, room);
    if (!clientId || !room) return;

    const player = room.server.players.find((p) => p.id === clientId);
    if (!player) {
      socket.emit("error", "Client is not a player in this room. (Maybe they left?)");
      return;
    }

    if (room.server.gameInProgress && player.role !== "Spectator") {
      socket.emit("error", `Game in progress! Wouldn't want to confuse people now would we?`);
      return;
    }

    if (existsNameCollision(socket, newName, room.server, clientId)) return;
    if (player.name === newName) return;

    updatePlayerNameInRoom(room, clientId, newName);
    broadcastRoomClientStates(room);
  });
}
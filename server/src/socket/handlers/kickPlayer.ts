import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms, io } from "../../index.js";
import { validateHost } from "../validators.js";
import { kickPlayerFromRoom, broadcastRoomClientStates } from "../roomService.js";

export function setupKickPlayerHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("kickPlayer", ({ playerId, code }: { playerId: string; code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    const player = room.server.players.find((p) => p.id === clientId);
    if (!player) {
      socket.emit("error", "Client is not a player in this room. (Maybe they left?)");
      return;
    }

    if (room.server.gameInProgress && player.role !== "Spectator") {
      socket.emit("error", `You cannot kick someone who is currently playing!`);
      return;
    }

    kickPlayerFromRoom(room, playerId);
    broadcastRoomClientStates(room);
    io.to(playerId).emit("disconnect_request", `You were kicked from ${room.server.code}`);
  });
}
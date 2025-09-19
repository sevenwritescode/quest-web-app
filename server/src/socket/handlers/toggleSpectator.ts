import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { togglePlayerSpectator, broadcastRoomClientStates } from "../roomService.js";

export function setupToggleSpectatorHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("toggleSpectator", ({ playerId, code }: { playerId: string; code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    if (room.server.gameInProgress) {
      socket.emit("error", "You can't become a spectator mid game silly!");
      return;
    }

    togglePlayerSpectator(room, playerId);
    broadcastRoomClientStates(room);
  });
}
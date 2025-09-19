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

    togglePlayerSpectator(room, playerId);
    broadcastRoomClientStates(room);
  });
}
import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { reorderPlayers, broadcastRoomClientStates } from "../roomService.js";

export function setupReorderPlayersHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("reorderPlayers", ({ playerIds, code }: { playerIds: string[]; code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    if (room.server.gameInProgress) {
      socket.emit("error", `You cannot reorder people during a game!`);
      return;
    }

    reorderPlayers(room, playerIds);
    broadcastRoomClientStates(room);
  });
}
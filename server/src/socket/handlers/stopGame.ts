import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { broadcastRoomClientStates, reorderPlayers } from "../roomService.js";


export function setupStopGameHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("stopGame", ({ code }: { code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    if (!room.server.gameInProgress) {
        socket.emit("error", "Game already in stopped.");
    }

    // stopGame(room);
    broadcastRoomClientStates(room);
  });
}
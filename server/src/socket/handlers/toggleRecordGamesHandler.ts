import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { broadcastRoomClientStates, toggleRecordGames } from "../roomService.js";

export function setupToggleRecordGamesHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("toggleRecordGames", ({ code }: { code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    try {
      toggleRecordGames(room);
    } catch (error: any) {
      socket.emit("error", error?.message || "Unable to toggle Record Games.");
      return;
    }

    broadcastRoomClientStates(room);
  });
}

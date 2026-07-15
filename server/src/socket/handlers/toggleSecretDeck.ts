import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { toggleSecretDeck, broadcastRoomClientStates } from "../roomService.js";

export function setupToggleSecretDeckHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("toggleSecretDeck", ({ code }: { code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    if (room.server.gameInProgress) {
      socket.emit("error", `Secret Deck cannot be changed mid-game.`);
      return;
    }

    toggleSecretDeck(room);
    broadcastRoomClientStates(room);
  });
}

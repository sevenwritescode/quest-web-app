import type { DefaultEventsMap, Socket } from "socket.io";
import type { Deck } from "../../types.ts";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { updateDeckInRoom, broadcastRoomClientStates } from "../roomService.js";

export function setupChangeDeckHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("changeDeck", ({ deck, code }: { deck: Deck; code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    updateDeckInRoom(room, deck);
    broadcastRoomClientStates(room);
  });
}
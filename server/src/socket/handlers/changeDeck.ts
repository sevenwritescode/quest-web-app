import type { DefaultEventsMap, Socket } from "socket.io";
import type { Deck } from "../../types.ts";
import { isRolePool } from "../../types.js";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { updateDeckInRoomByTarget, broadcastRoomClientStates } from "../roomService.js";

export function setupChangeDeckHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("changeDeck", ({
    deck,
    code,
    target
  }: {
    deck: Deck;
    code: string;
    target?: "public" | "secret";
  }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    if (room.server.gameInProgress) {
      socket.emit("error", `Decks cannot be changed mid-game.`);
      return;
    }

    // Validate RolePool draw sizes
    for (const item of deck.items) {
      if (isRolePool(item) && item.draw > item.roles.length) {
        socket.emit(
          "error",
          `Invalid deck: draw count (${item.draw}) exceeds available roles (${item.roles.length}).`
        );
        return;
      }
    }

    updateDeckInRoomByTarget(room, deck, target === "secret" ? "secret" : "public");
    broadcastRoomClientStates(room);
  });
}
import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateClient } from "../validators.js";
import { clientBecomeSpectator, broadcastRoomClientStates } from "../roomService.js";

export function setupBecomeSpectatorHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("becomeSpectator", ({ code }: { code: string }) => {
    const room = rooms[code];
    const clientId = validateClient(socket, room);
    if (!clientId || !room) return;

    const playerOnServer = room.server.players.find((p) => p.id === clientId);
    if (!playerOnServer) {
      socket.emit("error", "Player with this clientid not found on server");
      return;
    }
    if (playerOnServer.role === "Spectator") {
      return;
    }

    if (room.server.gameInProgress) {
      socket.emit("error", `Game in progress! Wouldn't want to confuse people now would we?`);
      return;
    }

    clientBecomeSpectator(room, clientId);
    broadcastRoomClientStates(room);
  });
}
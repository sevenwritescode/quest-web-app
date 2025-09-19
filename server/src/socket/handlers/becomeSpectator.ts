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

    clientBecomeSpectator(room, clientId);
    broadcastRoomClientStates(room);
  });
}
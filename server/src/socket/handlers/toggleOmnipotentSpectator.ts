import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { broadcastRoomClientStates, toggleOmnipotentSpectator } from "../roomService.js";
import { validateHost } from "../validators.js";


export function setupToggleOmnipotentSpectator(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("toggleOmnipotentSpectators", ({ code }: { code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    toggleOmnipotentSpectator(room);
    broadcastRoomClientStates(room);
  });
}
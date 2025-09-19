import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateClient } from "../validators.js";
import { clientLeaveRoom, broadcastRoomClientStates } from "../roomService.js";

export function setupLeaveRequestHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("leaveRequest", ({ code }: { code: string }) => {
    const room = rooms[code];
    const clientId = validateClient(socket, room);
    if (!clientId || !room) return;

    const player = room.server.players.find((p) => p.id === clientId);
    if (!player) {
      socket.emit("error", "You are not in this room.");
      return;
    }

    clientLeaveRoom(room, clientId);
    broadcastRoomClientStates(room);
    socket.emit("disconnect_request", `You successfully left room ${room.server.code}`);
  });
}
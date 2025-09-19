import type { DefaultEventsMap, Socket } from "socket.io";
import type { Room, RoomServerState } from "../types.ts";

export function validateClient(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  room: Room | undefined
): string {
  if (!room) {
    socket.emit("error", "Code not associated with room");
    return "";
  }
  const clientId = room.server.authToId[socket.data.sessionAuth];
  if (!clientId) {
    socket.emit("error", "Internal Server Error: clientId is not found in room.");
    return "";
  }
  return clientId;
}

export function validateHost(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  room: Room | undefined
): string {
  const clientId = validateClient(socket, room);
  if (!clientId || !room) {
    return "";
  }
  if (clientId !== room.server.hostId) {
    socket.emit("error", `You are not the host of ${room.server.code}.`);
    return "";
  }
  return clientId;
}

/**
 * Validate player display name. Emits error on socket if invalid.
 */
export function isValidName(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  newName?: string
): boolean {
  if (newName === undefined) return true;
  const validNameRegex = /^(?!\s)(?!.*\s$)[A-Za-z0-9._\s]+$/;
  if (!validNameRegex.test(newName) || newName.length > 20) {
    socket.emit(
      "error",
      "Invalid name: use 1-20 characters (letters, dots, underscores), spaces only between words, no leading/trailing space."
    );
    return false;
  }
  return true;
}

/**
 * Check for name collisions in existing room players. Emits error on socket if collision.
 */
export function existsNameCollision(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  newName: string | undefined,
  room: RoomServerState,
  clientId: string
): boolean {
  if (newName === undefined) return false;
  if (room.players.length === 0) return false;
  if (room.players.some((p) => p.name === newName && p.id !== clientId)) {
    socket.emit(
      "error",
      "Player Names must be unique: someone else in this lobby already has this name."
    );
    return true;
  }
  return false;
}
 

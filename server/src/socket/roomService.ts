import { io } from "../index.js";
import type { Room, Deck } from "../types.ts";

/**
 * Promote a client to spectator.
 */
export function clientBecomeSpectator(room: Room, clientId: string) {
  const playerOnServer = room.server.players.find((p) => p.id === clientId);
  if (!playerOnServer || playerOnServer.Role === "Spectator") {
    return;
  }
  playerOnServer.Role = "Spectator";

  for (const client of room.clients) {
    const playerOnClient = client.players.find((p) => p.id === clientId);
    if (!playerOnClient) {
      throw new Error(`Player with id ${clientId} not found in room.`);
    }
    playerOnClient.Role = "Spectator";
  }

  io.to(room.server.code).emit("logMessage", { mes: `${playerOnServer.name ?? "Anonymous"} is now a spectator.`, color: "gray" });
}

/**
 * Remove a player from the room entirely (server and client states).
 */
export function removePlayerFromRoom(room: Room, clientId: string) {
  room.server.players = room.server.players.filter((p) => p.id !== clientId);
  room.clients = room.clients.filter((p) => p.clientId !== clientId);
  for (const client of room.clients) {
    client.players = client.players.filter((p) => p.id !== clientId);
  }
}

/**
 * Handle a client leaving the room (broadcast message).
 */
export function clientLeaveRoom(room: Room, clientId: string) {
  removePlayerFromRoom(room, clientId);
  const playerName = room.server.players.find((p) => p.id === clientId)?.name;
  io.to(room.server.code).emit("logMessage", { mes: `${playerName ?? "Anonymous"} left the room.`, color: "red" });
}

/**
 * Kick a player from the room.
 */
export function kickPlayerFromRoom(room: Room, playerId: string) {
  const playerName = room.server.players.find((p) => p.id === playerId)?.name;
  removePlayerFromRoom(room, playerId);
  io.to(room.server.code).emit("logMessage", { mes: `${playerName ?? "Anonymous"} was kicked.`, color: "red" });
}

/**
 * Toggle spectator status for a player.
 */
export function togglePlayerSpectator(room: Room, playerId: string) {
  const playerOnServer = room.server.players.find((p) => p.id === playerId);
  if (!playerOnServer) {
    throw new Error("Player with this playerId not in room.");
  }
  playerOnServer.Role = playerOnServer.Role === "Spectator" ? "No Role" : "Spectator";

  for (const client of room.clients) {
    const playerOnClient = client.players.find((p) => p.id === playerId);
    if (!playerOnClient) {
      throw new Error("Player with this playerId is not found in at least one client.");
    }
    playerOnClient.Role = playerOnServer.Role;
  }

  const mes = playerOnServer.Role === "Spectator"
    ? `${playerOnServer.name ?? "Anonymous"} is now a spectator.`
    : `${playerOnServer.name ?? "Anonymous"} is no longer a spectator.`;

  io.to(room.server.code).emit("logMessage", { mes, color: "gray" });
}

/**
 * Reorder players in server and client views.
 */
export function reorderPlayers(room: Room, playerIds: string[]) {
  const newServerOrder = playerIds.map((id) => {
    const player = room.server.players.find((p) => p.id === id);
    if (!player) {
      throw new Error(`Player with id ${id} not found in room.`);
    }
    return player;
  });
  room.server.players = newServerOrder;

  for (const client of room.clients) {
    const newClientOrder = playerIds.map((id) => {
      const player = client.players.find((p) => p.id === id);
      if (!player) {
        throw new Error(`Player with id ${id} not found in client view.`);
      }
      return player;
    });
    client.players = newClientOrder;
  }

  io.to(room.server.code).emit("logMessage", { mes: "Players reordered.", color: "gray" });
}

/**
 * Update a player's display name throughout the room.
 */
export function updatePlayerNameInRoom(room: Room, clientId: string, newName: string | undefined) {
  const player = room.server.players.find((p) => p.id === clientId);
  const prevName = player?.name;
  if (player) {
    player.name = newName;
  }

  for (const clientState of room.clients) {
    const p = clientState.players.find((p) => p.id === clientId);
    if (p) {
      p.name = newName;
    }
  }

  io.to(room.server.code).emit("logMessage", { mes: `${prevName ?? "Anonymous"} changed their name to ${newName}.`, color: "gray" });
}

/**
 * Update the active deck in the room.
 */
export function updateDeckInRoom(room: Room, deck: Deck) {
  room.server.settings.deck = deck;
  for (const clientState of room.clients) {
    clientState.settings.deck = deck;
  }
  io.to(room.server.code).emit("logMessage", { mes: `Host updated Deck.` });
}

/**
 * Add a brand new client to server and existing client states.
 */
export function addNewClient(room: Room, clientId: string, name?: string) {
  room.clients.push({
    clientId,
    hostId: room.server.hostId,
    code: room.server.code,
    players: room.server.players.map((player) => ({ ...player })),
    settings: {
      deck: JSON.parse(JSON.stringify(room.server.settings.deck)),
    },
  });

  room.server.players.push({
    id: clientId,
    name,
    Role: "Spectator",
    roleKnown: true,
    allegianceKnown: true,
  });

  for (const clientState of room.clients) {
    clientState.players.push({
      id: clientId,
      name,
      Role: "Spectator",
      roleKnown: true,
      allegianceKnown: true,
    });
  }
}

/**
 * Push current room state to all connected clients.
 */
export function broadcastRoomClientStates(room: Room) {
  for (const player of room.server.players) {
    io.to(player.id).emit(
      "roomStateUpdate",
      room.clients.find((p) => p.clientId === player.id)
    );
  }
}
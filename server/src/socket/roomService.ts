import { randomBytes } from "crypto";
import { io } from "../index.js";
import { type Room, type Deck, type Role, isRolePool, ROLE_DATA } from "../types.js";
import { shuffle } from "../utils.js";
import { DEFAULT_SECRET_PROVIDER, SECRET_PROVIDERS } from "./roleSecrets.js";

/**
 * Promote a client to spectator.
 */
export function clientBecomeSpectator(room: Room, clientId: string) {
  const playerOnServer = room.server.players.find((p) => p.id === clientId);
  if (!playerOnServer || playerOnServer.role === "Spectator") {
    return;
  }
  playerOnServer.role = "Spectator";

  for (const client of room.clients) {
    const playerOnClient = client.players.find((p) => p.id === clientId);
    if (!playerOnClient) {
      throw new Error(`Player with id ${clientId} not found in room.`);
    }
    playerOnClient.role = "Spectator";
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
  playerOnServer.role = playerOnServer.role === "Spectator" ? "No Role" : "Spectator";

  for (const client of room.clients) {
    const playerOnClient = client.players.find((p) => p.id === playerId);
    if (!playerOnClient) {
      throw new Error("Player with this playerId is not found in at least one client.");
    }
    playerOnClient.role = playerOnServer.role;
  }

  const mes = playerOnServer.role === "Spectator"
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

export function startGame(room: Room) {
  console.log("Before Start: ")
  console.dir(room, { depth: null, colors: true });
  console.log("\n");

  // Distribute Roles on Server Side
  const roles = shuffleDeck(room.server.settings.deck);
  roles.forEach((role, i) => {
    const player = room.server.players[i];
    if (!player) {
      throw new Error(`Player at index ${i} is undefined`);
    }
    player.role = role;
    player.allegiance = ROLE_DATA[role].allegiance;
  });

  console.log("After Role Distribution: ")
  console.dir(room, { depth: null, colors: true });
  console.log("\n");

  // randomly select a first leader
  const playerIds = room.server.players.map(p => p.id);
  const rand = randomBytes(4).readUInt32BE(0);
  const firstLeaderId = playerIds[rand % playerIds.length];
  room.server.firstLeaderId = firstLeaderId;
  for (const client of room.clients) {
    client.firstLeaderId = firstLeaderId;
  }

  console.log("After Random Leader Selection: ")
  console.dir(room, { depth: null, colors: true });
  console.log("\n");

  // Inform Clients of Their Own Role and Secret Info
  for (const client of room.clients) {
    // 1) start with a fresh “unknown” view:
    client.gameInProgress = true;
    client.players = room.server.players.map(p => ({
      id: p.id,
      name: p.name,
      role: "Unknown" as const,
      allegiance: "Unknown" as const,
    }));

    console.dir(client.players, { depth: null, colors: null });

    // 1a) learn of own role
    const clientPlayer = client.players.find(p => p.id === client.clientId);
    const serverPlayer = room.server.players.find((p) => p.id === client.clientId);
    clientPlayer!.role = serverPlayer!.role;
    clientPlayer!.allegiance = serverPlayer!.allegiance;

    // 2) pick your own provider
    const me = room.server.players.find(p => p.id === client.clientId)!;
    const fn = SECRET_PROVIDERS[me.role] ?? DEFAULT_SECRET_PROVIDER;

    // 3) apply only the overrides this role gets
    const overrides = fn(room.server, me);
    console.log(`My Role: ${me.role}`);
    console.log("My overrides:")
    console.log(overrides);
    for (const [id, { role, allegiance }] of Object.entries(overrides)) {
      console.log(`id: ${id}`);
      console.log(`role: ${role}`);
      console.log(`allegiance: ${allegiance}`);
      const view = client.players.find(v => v.id === id)!;
      console.log(`view ${view}`);
      if (role) view.role = role;
      if (allegiance) view.allegiance = allegiance;
    }
  }

  io.to(room.server.code).emit("logMessage", { 
    mes: "Game Start! View Secret Info in the Knowledge Tab",
    color: "green"
  });
}

function shuffleDeck(deck: Deck): Role[] {
  const returnVal: Role[] = [];
  for (const di of deck.items) {
    if (isRolePool(di)) {
      const shuffledPool = shuffle(di.roles);
      for (let i = 0; i < di.draw; i++) {
        if (shuffledPool.length == 0) {
          throw new Error("Invalid Deck: Draw value is invalid for this pool.")
        }
        returnVal.push(shuffledPool.pop()!);
      }
    }
    else {
      returnVal.push(di);
    }
  }

  return shuffle(returnVal);
}




export function stopGame(room: Room) {

}


/**
 * Add a brand new client to server and existing client states.
 */
export function addNewClient(room: Room, clientId: string, name?: string) {
  room.clients.push({
    clientId,
    hostId: room.server.hostId,
    code: room.server.code,
    firstLeaderId: room.server.firstLeaderId,
    gameInProgress: room.server.gameInProgress,
    players: room.server.players.map((player) => ({ ...player })),
    settings: {
      deck: JSON.parse(JSON.stringify(room.server.settings.deck)),
    },
  });

  room.server.players.push({
    id: clientId,
    name,
    role: room.server.gameInProgress ? "Spectator" : "No Role",
    allegiance: "No Allegiance"
  });

  for (const clientState of room.clients) {
    clientState.players.push({
      id: clientId,
      name,
      role: room.server.gameInProgress ? "Spectator" : "No Role",
      allegiance: "No Allegiance"
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
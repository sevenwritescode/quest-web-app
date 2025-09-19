import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { broadcastRoomClientStates, reorderPlayers } from "../roomService.js";
import { isRolePool, ROLE_DATA, type Deck, type Role } from "../../types.js";
import { shuffle } from "../../utils.js";
import { randomBytes } from "crypto";
import { DEFAULT_SECRET_PROVIDER, SECRET_PROVIDERS } from "../roleSecrets.js";


export function setupStartGameHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("startGame", ({ code }: { code: string }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    if (room.server.gameInProgress) {
        socket.emit("error", "Game already in progress."); return;
    }

    // ensure that deck is valid in terms of player count
    const deckPlayerCount = numberOfPlayersForDeck(room.server.settings.deck);
    const roomPlayerCount = room.server.players.filter(player => player.role !== "Spectator").length;
    if (deckPlayerCount !== roomPlayerCount)
    {
        socket.emit("error", 
        `Player count required by deck (${deckPlayerCount}) much match the current player count (${roomPlayerCount}) before starting a game.`);
        return;
    }

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

    // Inform Clients of Their Own Role and Secret Info
    for (const client of room.clients) {
        // 1) start with a fresh “unknown” view:
        client.players = room.server.players.map(p => ({
            id: p.id,
            name: p.name,
            role: "Unknown" as const,
            allegiance: "Unknown" as const,
        }));

        // 1a) learn of own role
        const clientPlayer = client.players.find(p => p.id = client.clientId);
        const serverPlayer = room.server.players.find((p) => p.id === client.clientId);
        clientPlayer!.role = serverPlayer!.role; 
        clientPlayer!.allegiance = serverPlayer!.allegiance;

        // 2) pick your own provider
        const me = room.server.players.find(p => p.id === client.clientId)!;
        const fn = SECRET_PROVIDERS[me.role] ?? DEFAULT_SECRET_PROVIDER;

        // 3) apply only the overrides this role gets
        const overrides = fn(room.server, me);
        for (const [id, { role, allegiance }] of Object.entries(overrides)) {
            const view = client.players.find(v => v.id === id)!;
            if (role)      view.role = role;
            if (allegiance) view.allegiance = allegiance;
        }
    }

    // randomly select a first leader
    const playerIds = room.server.players.map(p => p.id);
    const rand = randomBytes(4).readUInt32BE(0);
    const firstLeaderId = playerIds[rand % playerIds.length];
    room.server.firstLeaderId = firstLeaderId;
    for (const client of room.clients) {
        client.firstLeaderId = firstLeaderId;
    }

    broadcastRoomClientStates(room);
  });
}

function numberOfPlayersForDeck(deck: Deck) {
  let count = 0;
  for (const deckItem of deck.items) {
    if (isRolePool(deckItem)) {
      count += deckItem.draw;
    }
    else {
      count += 1;
    }
  }
  return count;
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
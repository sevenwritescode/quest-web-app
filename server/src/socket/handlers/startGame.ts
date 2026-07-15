import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { broadcastRoomClientStates, startGame } from "../roomService.js";
import { getEffectiveDeck, numberOfPlayersForDeck } from "../../types.js";


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
    const deckPlayerCount = numberOfPlayersForDeck(getEffectiveDeck(room.server.settings));
    const roomPlayerCount = room.server.players.filter(player => player.role !== "Spectator").length;
    if (deckPlayerCount !== roomPlayerCount)
    {
        socket.emit("error", 
        `Player count required by deck (${deckPlayerCount}) much match the current player count (${roomPlayerCount}) before starting a game.`);
        return;
    }

    // ensure that everyone that is playing has a name
    for (const player of room.server.players) {
        if (player.name === undefined && player.role !== "Spectator") {
            socket.emit("error",
                `Everyone who is not a spectator must have a name.`
            );
            return;
        }
    }

    startGame(room);  
    broadcastRoomClientStates(room);
  });
}



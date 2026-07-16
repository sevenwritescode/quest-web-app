import type { DefaultEventsMap, Socket } from "socket.io";
import { rooms } from "../../index.js";
import { validateHost } from "../validators.js";
import { broadcastRoomClientStates, reorderPlayers, stopGame } from "../roomService.js";
import type { DetailedGameRecord, StopGameRecordingInput } from "../../types.js";
import { appendGameRecord } from "../../recording/gameRecordStore.js";

function isValidDetailedRecord(detailedRecord: DetailedGameRecord) {
  const questNumbers = detailedRecord.quests.map((q) => q.questNumber);
  const amuletIndexes = detailedRecord.amulets.map((a) => a.index);
  const validQuestNumbers = questNumbers.every((n) => n >= 1 && n <= 5);
  const validAmuletIndexes = amuletIndexes.every((n) => n >= 1 && n <= 3);
  if (!validQuestNumbers || !validAmuletIndexes) {
    return false;
  }

  const sortedQuestNumbers = [...questNumbers].sort((a, b) => a - b);
  for (let i = 0; i < sortedQuestNumbers.length; i += 1) {
    if (sortedQuestNumbers[i] !== (i + 1)) {
      return false;
    }
  }

  const sortedAmuletIndexes = [...amuletIndexes].sort((a, b) => a - b);
  for (let i = 0; i < sortedAmuletIndexes.length; i += 1) {
    if (sortedAmuletIndexes[i] !== (i + 1)) {
      return false;
    }
  }

  const goodWins = detailedRecord.quests.filter((q) => q.outcome === "Good").length;
  const evilWins = detailedRecord.quests.filter((q) => q.outcome === "Evil").length;
  const validWinState = (goodWins === 3) !== (evilWins === 3);
  if (!validWinState) {
    return false;
  }

  if (evilWins === 3 && !detailedRecord.endGameBranch) {
    return false;
  }

  return true;
}


export function setupStopGameHandler(
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) {
  socket.on("stopGame", async ({
    code,
    recording,
  }: {
    code: string,
    recording?: StopGameRecordingInput,
  }) => {
    const room = rooms[code];
    const clientId = validateHost(socket, room);
    if (!clientId || !room) return;

    if (!room.server.gameInProgress) {
        socket.emit("error", "Game already stopped.");
        return;
    }

    const requiresRecord = room.server.settings.recordGamesEnabled && !room.server.settings.secretDeckEnabled;

    if (requiresRecord) {
      if (!recording) {
        socket.emit("error", "Recording details are required before stopping this game.");
        return;
      }

      if (recording.winningTeam !== "Good" && recording.winningTeam !== "Evil") {
        socket.emit("error", "Winning team must be either Good or Evil.");
        return;
      }

      if (!Number.isFinite(recording.confirmedStopAtMs) || recording.confirmedStopAtMs <= 0) {
        socket.emit("error", "Invalid stop confirmation timestamp.");
        return;
      }

      if (recording.detailedRecord && (!recording.hostSecret || recording.hostSecret.trim() === "")) {
        socket.emit("error", "hostSecret is required for detailed records.");
        return;
      }

      if (recording.detailedRecord && !isValidDetailedRecord(recording.detailedRecord)) {
        socket.emit("error", "Detailed record is invalid.");
        return;
      }

      try {
        const trimmedHostSecret = recording.hostSecret?.trim();
        await appendGameRecord(
          JSON.parse(JSON.stringify(room.server)),
          {
            ...recording,
            ...(trimmedHostSecret ? { hostSecret: trimmedHostSecret } : {}),
          }
        );
      } catch (error: any) {
        socket.emit("error", error?.message || "Unable to persist game record.");
        return;
      }
    }

    stopGame(room);
    broadcastRoomClientStates(room);
  });
}
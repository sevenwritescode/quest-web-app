import { promises as fs } from "fs";
import path from "path";
import type { DetailedGameRecord, StopGameRecordingInput, WinningTeam, RoomServerState } from "../types.js";

type PersistedRoomServerState = Omit<RoomServerState, "authToId" | "settings"> & {
  settings: {
    omnipotentSpectators: boolean,
    recordGamesEnabled: boolean,
    deck: RoomServerState["settings"]["deck"],
  },
};

export type StoredGameRecord = {
  id: string,
  createdAtIso: string,
  winningTeam: WinningTeam,
  hostSecret?: string,
  startedAtMs: number,
  stoppedConfirmedAtMs: number,
  durationMs: number,
  durationSeconds: number,
  roomServerState: PersistedRoomServerState,
  detailedRecord?: DetailedGameRecord,
};

const RECORD_FILE_PATH = path.resolve(process.cwd(), "game-records.json");
let writeQueue: Promise<void> = Promise.resolve();

async function readAllRecords(): Promise<StoredGameRecord[]> {
  try {
    const content = await fs.readFile(RECORD_FILE_PATH, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed as StoredGameRecord[] : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeAllRecords(records: StoredGameRecord[]) {
  const serialized = JSON.stringify(records, null, 2);
  await fs.writeFile(RECORD_FILE_PATH, serialized, "utf8");
}

function sanitizeRoomServerState(roomServerState: RoomServerState): PersistedRoomServerState {
  return {
    code: roomServerState.code,
    players: roomServerState.players,
    hostId: roomServerState.hostId,
    firstLeaderId: roomServerState.firstLeaderId,
    gameInProgress: roomServerState.gameInProgress,
    gameStartedAtMs: roomServerState.gameStartedAtMs,
    settings: {
      omnipotentSpectators: roomServerState.settings.omnipotentSpectators,
      recordGamesEnabled: roomServerState.settings.recordGamesEnabled,
      deck: roomServerState.settings.deck,
    },
  };
}

export function appendGameRecord(
  roomServerState: RoomServerState,
  recording: StopGameRecordingInput
): Promise<void> {
  const startedAtMs = roomServerState.gameStartedAtMs;
  if (startedAtMs === undefined) {
    throw new Error("Cannot record game: game start timestamp is missing.");
  }

  const stoppedConfirmedAtMs = Math.max(recording.confirmedStopAtMs, startedAtMs);
  const durationMs = Math.max(0, stoppedConfirmedAtMs - startedAtMs);

  const record: StoredGameRecord = {
    id: `${roomServerState.code}-${startedAtMs}-${stoppedConfirmedAtMs}`,
    createdAtIso: new Date().toISOString(),
    winningTeam: recording.winningTeam,
    ...(recording.hostSecret ? { hostSecret: recording.hostSecret } : {}),
    startedAtMs,
    stoppedConfirmedAtMs,
    durationMs,
    durationSeconds: Math.floor(durationMs / 1000),
    roomServerState: sanitizeRoomServerState(roomServerState),
    ...(recording.detailedRecord ? { detailedRecord: recording.detailedRecord } : {}),
  };

  writeQueue = writeQueue.then(async () => {
    const records = await readAllRecords();
    records.push(record);
    await writeAllRecords(records);
  });

  return writeQueue;
}

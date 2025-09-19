import { type RoomServerState, type Player, type Role, type Allegiance, numberOfPlayersForDeck } from "../types.js";

export type RevealOverrides = Record<
  string,
  { role?: Role; allegiance?: Allegiance }
>;

export type SecretProvider = (
  room: RoomServerState,
  you: Player
) => RevealOverrides;

// default provider: no reveals
export const DEFAULT_SECRET_PROVIDER: SecretProvider = () => ({});


const seeAllVisibleEvil: SecretProvider = (room, you) => {
  const visibleEvil = room.players
    .filter((p: Player) => p.id !== you.id 
          && p.allegiance === "Evil" 
          && p.role !== "Blind Hunter"
          && p.role !== "Changeling"
          && p.role !== "Scion")
    .map((p: Player) => p.id);
  let initInfo: RevealOverrides = {};
  const blindHunter = room.players.find(p => p.role === "Blind Hunter");
  if (!room.settings.deck.directorsCut && numberOfPlayersForDeck(room.settings.deck) <= 5 && blindHunter) {
    initInfo[blindHunter.id] = { allegiance: blindHunter.allegiance, role: blindHunter.role }
  }
  const scion = room.players.find(p => p.role === "Scion");
  if (you.role === "Morgan Le Fay" && scion) {
    initInfo[scion.id] = { allegiance: scion.allegiance, role: scion.role }
  }
  return visibleEvil.reduce<RevealOverrides>(
    (o: RevealOverrides, id: string) => {
      o[id] = { allegiance: room.players.find((p: Player) => p.id === id)!.allegiance };
      return o;
    },
    initInfo
  );
}

// only roles with special knowledge need entries here
export const SECRET_PROVIDERS: Partial<Record<Role, SecretProvider>> = {
  "Morgan Le Fay": seeAllVisibleEvil,
  "Minion of Mordred": seeAllVisibleEvil,
  // "Blind Hunter": DEFAULT_SECRET_PROVIDER,
  // "Changeling": DEFAULT_SECRET_PROVIDER,
  // "Scion": DEFAULT_SECRET_PROVIDER,
  "Revealer": seeAllVisibleEvil,
  "Trickster": seeAllVisibleEvil,
  "Lunatic": seeAllVisibleEvil,
  "Brute": seeAllVisibleEvil,
  // "Mutineer": DEFAULT_SECRET_PROVIDER,
  // "Loyal Servant of Arthur": DEFAULT_SECRET_PROVIDER,
  // "Duke": DEFAULT_SECRET_PROVIDER,
  // "Archduke": DEFAULT_SECRET_PROVIDER,
  // "Apprentice": DEFAULT_SECRET_PROVIDER,
  // "Troublemaker": DEFAULT_SECRET_PROVIDER,
  // "Youth": DEFAULT_SECRET_PROVIDER,
  "Cleric": (room, you) => {
    // Reveal one Evil player's allegiance to the Cleric
    const firstLeader = room.players.find(p => p.id !== you.id && p.id === room.firstLeaderId);
    if (!firstLeader) { return {}; }
    let seenAllegiance = firstLeader.allegiance;
    if (firstLeader.role === "Troublemaker") {
      seenAllegiance = "Evil";
    }
    return { [firstLeader.id]: { allegiance: seenAllegiance } }
  },
  "Arthur": (room, you) => {
    const morgan = room.players.find(p => p.id !== you.id && p.role === "Morgan Le Fay");
    if (!morgan) return {};
    return { [morgan.id]: { role: morgan.role } };
  }
};

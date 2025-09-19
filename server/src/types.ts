export type Role =
  | "Spectator"
  | "No Role"
  | "Unknown"
  | "Morgan Le Fay"
  | "Minion of Mordred"
  | "Blind Hunter"
  | "Changeling"
  | "Scion"
  | "Revealer"
  | "Trickster"
  | "Lunatic"
  | "Brute"
  | "Mutineer"
  | "Loyal Servant of Arthur"
  | "Duke"
  | "Archduke"
  | "Apprentice"
  | "Troublemaker"
  | "Youth"
  | "Cleric"
  | "Arthur"

export type Allegiance = 
  | "No Allegiance"
  | "Unknown"
  | "Good"
  | "Evil"

export type Player = { 
  id: string,
  name: string | undefined,
  role: Role, 
  allegiance: Allegiance 
}

export type DeckItem =
  | Role
  | RolePool

export type RolePool = {
  draw: number,
  roles: Role[]
}

export function isRolePool(d: DeckItem): d is RolePool {
  return typeof (d as RolePool).draw === "number"
        && Array.isArray((d as RolePool).roles);
}

export type Deck = {
  directorsCut: boolean,
  items: DeckItem[]
}


export type RoomClientState = {
  code: string,
  players: Player[], 
  clientId: string, 
  hostId: string,
  firstLeaderId: string | undefined,
  gameInProgress: boolean,
  settings: {
    deck: Deck,
  }
}


export type RoleInfo = {
  allegiance: Allegiance;
};

export const ROLE_DATA: Record<Role, RoleInfo> = {
  "Spectator":                { allegiance: "No Allegiance" },
  "No Role":                  { allegiance: "No Allegiance" },
  "Unknown":                  { allegiance: "Unknown" },
  "Morgan Le Fay":            { allegiance: "Evil" },
  "Minion of Mordred":        { allegiance: "Evil" },
  "Blind Hunter":             { allegiance: "Evil" },
  "Changeling":               { allegiance: "Evil" },
  "Scion":                    { allegiance: "Evil" },
  "Revealer":                 { allegiance: "Evil" },
  "Trickster":                { allegiance: "Evil" },
  "Lunatic":                  { allegiance: "Evil" },
  "Brute":                    { allegiance: "Evil" },
  "Mutineer":                 { allegiance: "Evil" },
  "Loyal Servant of Arthur":  { allegiance: "Good" },
  "Duke":                     { allegiance: "Good" },
  "Archduke":                 { allegiance: "Good" },
  "Apprentice":               { allegiance: "Good" },
  "Troublemaker":             { allegiance: "Good" },
  "Youth":                    { allegiance: "Good" },
  "Cleric":                   { allegiance: "Good" },
  "Arthur":                   { allegiance: "Good" },
};



/* server only type */
export type RoomServerState = { 
  code: string, 
  players: Player[],
  hostId: string,
  firstLeaderId: string | undefined,
  gameInProgress: boolean, 
  settings: {
    deck: Deck 
  }
  // server only props
  authToId: Record<string,string>
}


/* server only type */
export type Room = { server: RoomServerState, clients: RoomClientState[] }

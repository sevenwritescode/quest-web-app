export type LandingState = {
  name: string,
  code: string,
  error?: string,
  hostLoading: boolean,
  joinLoading: boolean
}

export type Role =
  | "Spectator"
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

export type Player = { id: string; name?: string; Role?: Role, roleKnown: boolean, allegianceKnown: boolean }

export type DeckItem =
  | Role
  | RolePool

export type RolePool = {
  draw: number,
  roles: Role[]
}

export type Deck = {
  items: DeckItem[]
}

export type RoomClientState = {
  code: string,
  players: Player[],
  clientId: string,
  hostId: string,
  settings: {
    numberOfPlayers: number,
    deck: Deck
  }
  
  // non-server reflected state
  log: { mes: string, color: string }[],
  error?: string,
}
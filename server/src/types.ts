export type Role = "Spectator"
export type Player = { id: string; name: string | undefined; Role?: Role, roleKnown: boolean, allegianceKnown: boolean}

export type RoomClientState = {
  code: string,
  players: Player[], 
  clientId: string, 
  hostId: string,
  settings: {
    numberOfPlayers: number; 

  }
}

export type RoomState = { 
  code: string, 
  players: Player[],
  hostId: string, 
  settings: {
    numberOfPlayers: number;
  }
  authToId: Record<string,string>
}

export type Room = { server: RoomState, clients: RoomClientState[] }
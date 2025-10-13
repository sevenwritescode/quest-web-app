# Quest Web Companion App

- Quest Web App is a browser-based platform for the social deduction game Quest.
- Provides multiplayer lobbies and secret role assignment. 

Live Demo: https://valyte.xyz/

## Usage
1. Enter your name and room code (or host a new game).  
2. Secretly receive your role.

## Key Highlights
- No installation required: browser-based client
- Real-time synchronization via Socket.io
- React + TypeScript UI, powered by Vite
- Customizable JSON-based role decks (see below)

## Custom Deck JSON Format
```json
{
  "directorsCut": true,
  "items": [
    "Arthur",
    "Morgan Le Fay",
    { "draw": 2, "roles": ["Minion of Mordred","Blind Hunter","Trickster"] }
  ]
}
```
- **directorsCut**: (`true`/`false`).
- **items**: Mix of single role names or role-pool objects:
  - String: one role card
  - Object: `{ draw: number, roles: string[] }`

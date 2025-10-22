# Quest Web Companion App

- Browser-based application used to automate elements of the social deduction game Quest.
- Provides multiplayer lobbies and secret role assignments.

The canonical instance is hosted here: https://valyte.xyz/

## Usage
1. Enter your name and room code (or host a new game).
2. Host can manage players, adjust game settings including deck composition, and start/stop games. 
3. Secretly receive your role on game start.

## Key Highlights
- No installation required: browser-based, mobile friendly client
- Real-time synchronization via Socket.io
- React + TypeScript UI, with Vite
- Customizable JSON-based role decks (see below)

## Custom Deck JSON Format
```json
{
    directorsCut: true,
    items: [
        "Cleric",
        {
            draw: 1,
            roles: [
                "Troublemaker",
                "Youth"
            ]
        },
        "Duke",
        "Minion of Mordred",
        "Minion of Mordred",
        "Morgan Le Fay",
        "Blind Hunter"
    ]
}
```
- **directorsCut**: (`true`/`false`).
- **items**: Mix of single role names or role-pool objects:
  - String: one role card: 
  - Object: `{ draw: number, roles: string[] }`

The comprehensive list of roles is as follows:
```
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
```

import type { Deck } from "../../types"


export const DirectorsCut4Player: Deck = {
    items: [
        {
            draw: 2,
            roles: [
                "Loyal Servant of Arthur",
                "Cleric",
                "Youth"
            ]
        },
        "Morgan Le Fay",
        "Blind Hunter"
    ]
} as const;

export const DirectorsCut5Player: Deck = {
    items: [
        {
            draw: 2,
            roles: [
                "Loyal Servant of Arthur",
                "Cleric",
                "Youth"
            ]
        },
        "Morgan Le Fay",
        "Blind Hunter",
        "Minion of Mordred"
    ]
} as const;

export const DirectorsCut6Player: Deck = {
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
        "Morgan Le Fay",
        "Blind Hunter"
    ]
} as const;

export const DirectorsCut7Player: Deck = {
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
} as const;

export const DirectorsCut8Player: Deck = {
    items: [
        "Cleric",
        {
            draw: 1,
            roles: [
                "Loyal Servant of Arthur",
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
} as const;

export const DirectorsCut9Player: Deck = {
    items: [
        "Cleric",
        {
            draw: 1,
            roles: [
                "Loyal Servant of Arthur",
                "Troublemaker",
                "Youth"
            ]
        },
        "Archduke",
        "Minion of Mordred",
        "Minion of Mordred",
        "Minion of Mordred",
        "Morgan Le Fay",
        "Blind Hunter"
    ]
} as const;

export const DirectorsCut10Player: Deck = {
    items: [
        "Cleric",
        {
            draw: 1,
            roles: [
                "Loyal Servant of Arthur",
                "Troublemaker",
                "Youth"
            ]
        },
        "Duke",
        "Archduke",
        "Minion of Mordred",
        "Minion of Mordred",
        "Minion of Mordred",
        "Morgan Le Fay",
        "Blind Hunter"
    ]
} as const;

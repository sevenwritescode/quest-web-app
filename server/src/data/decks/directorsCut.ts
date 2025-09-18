import type { Deck } from "../../types.ts"


export const p4dc: Deck = {
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

export const p5dc: Deck = {
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

export const p6dc: Deck = {
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

export const p7dc: Deck = {
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

export const p8dc: Deck = {
    items: [
        "Cleric",
        {
            draw: 2,
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

export const p9dc: Deck = {
    items: [
        "Cleric",
        {
            draw: 2,
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

export const p10dc: Deck = {
    items: [
        "Cleric",
        {
            draw: 2,
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

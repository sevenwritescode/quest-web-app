import { p10b, p4b, p5b, p6b, p7b, p8b, p9b } from "./base.js";
import { p10dc, p4dc, p5dc, p6dc, p7dc, p8dc, p9dc } from "./directorsCut.js";


export const canonicalDecks = {
    p4b,
    p5b,
    p6b,
    p7b,
    p8b,
    p9b,
    p10b,
    p4dc,
    p5dc,
    p6dc,
    p7dc,
    p8dc,
    p9dc,
    p10dc
} as const;

export type CanonicalDecksKey = keyof typeof canonicalDecks;
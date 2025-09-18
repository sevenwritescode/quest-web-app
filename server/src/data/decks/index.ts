import {
    Base4Player as p4b,
    Base5Player as p5b,
    Base6Player as p6b,
    Base7Player as p7b,
    Base8Player as p8b,
    Base9Player as p9b,
    Base10Player as p10b
} from "./base.js";
import {
    DirectorsCut4Player as p4dc,
    DirectorsCut5Player as p5dc,
    DirectorsCut6Player as p6dc,
    DirectorsCut7Player as p7dc,
    DirectorsCut8Player as p8dc,
    DirectorsCut9Player as p9dc,
    DirectorsCut10Player as p10dc
} from "./directorsCut.js";


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
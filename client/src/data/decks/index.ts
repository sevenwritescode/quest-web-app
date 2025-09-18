import {
    Base4Player,
    Base5Player,
    Base6Player,
    Base7Player,
    Base8Player,
    Base9Player,
    Base10Player
} from "./base";
import {
    DirectorsCut4Player,
    DirectorsCut5Player,
    DirectorsCut6Player,
    DirectorsCut7Player,
    DirectorsCut8Player,
    DirectorsCut9Player,
    DirectorsCut10Player
} from "./directorsCut";


export const canonicalDecks = {
    Base4Player,
    Base5Player,
    Base6Player,
    Base7Player,
    Base8Player,
    Base9Player,
    Base10Player,
    DirectorsCut4Player,
    DirectorsCut5Player,
    DirectorsCut6Player,
    DirectorsCut7Player,
    DirectorsCut8Player,
    DirectorsCut9Player,
    DirectorsCut10Player
} as const;

export type CanonicalDecksKey = keyof typeof canonicalDecks;
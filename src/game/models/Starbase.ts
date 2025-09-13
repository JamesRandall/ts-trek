import type {UniversePosition} from "./universePosition.ts";
import {createRangedValue, type RangedValue} from "./RangedValue.ts";
import {type GameObject, GameObjectType} from "./gameObject.ts";

export type StarbaseAttributes = {
    hull: RangedValue;
    shields: RangedValue;
    energy: RangedValue;
    torpedoStocks: RangedValue
}

export interface Starbase extends GameObject {
    name: string;
    attributes: StarbaseAttributes;
}

export const createStarbase = (position: UniversePosition, starbaseNumber: number) : Starbase => ({
    id: crypto.randomUUID(),
    name: createStarbaseName(starbaseNumber),
    type: GameObjectType.Starbase,
    position,
    attributes: {
        hull: createRangedValue(3000),
        shields: createRangedValue(6000),
        energy: createRangedValue(10000),
        torpedoStocks: createRangedValue(100)
    },
    rotation: 0
});

const createStarbaseName = (starbaseNumber: number) => {
    const greekLetters = [
        "Alpha",
        "Beta",
        "Gamma",
        "Delta",
        "Epsilon",
        "Zeta",
        "Eta",
        "Theta",
        "Iota",
        "Kappa",
        "Lambda",
        "Mu",
        "Nu",
        "Xi",
        "Omicron",
        "Pi",
        "Rho",
        "Sigma",
        "Tau",
        "Upsilon",
        "Phi",
        "Chi",
        "Psi",
        "Omega"
    ];

    return `Starbase ${greekLetters[starbaseNumber % greekLetters.length]}`;
}
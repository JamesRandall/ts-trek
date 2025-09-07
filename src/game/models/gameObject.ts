import type {UniversePosition} from "./universePosition.ts";
import type {AssetManager} from "../AssetManager.tsx";
import {arePositionsEqual as ape } from "./universePosition.ts";

export const GameObjectType = {
    Enemy: 'Enemy',
    Starbase: 'Starbase',
    Star: 'Star',
    Player: 'Player'
} as const;

export type GameObjectType = typeof GameObjectType[keyof typeof GameObjectType];

export interface GameObject {
    id: string;
    type: GameObjectType;
    position: UniversePosition;
    asset: (assetManager: AssetManager | null) => HTMLImageElement | null;
    rotation: number;
}

export function arePositionsEqual(obj1: GameObject, obj2: GameObject) {
    return ape(obj1.position, obj2.position);
}

export function areInSameQuadrant(obj1: GameObject, obj2: GameObject) {
    return obj1.position.quadrant.x === obj2.position.quadrant.x &&
        obj1.position.quadrant.y === obj2.position.quadrant.y;
}

export function isInQuadrant(obj1: GameObject, quadrant: {x: number, y: number}) {
    return obj1.position.quadrant.x === quadrant.x &&
        obj1.position.quadrant.y === quadrant.y;
}

export function isInSector(obj1: GameObject, sector: {x: number, y: number}) {
    return obj1.position.sector.x === sector.x &&
        obj1.position.sector.y === sector.y;
}
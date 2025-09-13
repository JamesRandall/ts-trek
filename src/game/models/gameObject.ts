import type {UniversePosition} from "./universePosition.ts";
import type {AssetManager} from "../AssetManager.tsx";
import {arePositionsEqual as ape } from "./universePosition.ts";
import {type Enemy, EnemyType} from "./Enemy.ts";

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
    rotation: number;
}

export function getGameObjectAsset(gameObject: GameObject | null, assetManager: AssetManager | null) {
    if (!gameObject || !assetManager) return null;
    switch(gameObject.type) {
        default: return null;
        case GameObjectType.Starbase: return assetManager.starbase;
        case GameObjectType.Star: return assetManager.star;
        case GameObjectType.Player: return assetManager.player;
        case GameObjectType.Enemy:
            switch ((gameObject as Enemy).enemyType) {
                case EnemyType.Cube: return assetManager.enemyCube;
                case EnemyType.Scout: return assetManager.enemyScout;
                case EnemyType.Warbird: return assetManager.enemyWarbird;
            }
    }
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
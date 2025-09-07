import type {ReadonlyContextAccessor} from "../state/store.ts";
import {isInQuadrant, type GameObject, isInSector} from "../models/gameObject.ts";
import type {UniversePosition} from "../models/universePosition.ts";
import * as GameConstants from "../gameConstants.ts";
import type {GameData} from "../models/gameData.ts";


export function objectAtPosition(state : ReadonlyContextAccessor | GameData, universePosition: UniversePosition) {
    const localObjects = objectsInQuadrant(state, universePosition.quadrant);
    return localObjects.find(o => isInSector(o, universePosition.sector));
}

export function objectsInQuadrant(state : ReadonlyContextAccessor | GameData, quadrant: {x: number, y: number} | null = null) : GameObject[] {
    const gameData = 'get' in state ? state.get().gameData : state;
    quadrant = quadrant ?? gameData.player.position.quadrant;
    const filteredStars = gameData.stars.filter(s => isInQuadrant(s, quadrant));
    const filteredEnemies = gameData.enemies.filter(e => isInQuadrant(e, quadrant));
    const filteredStarbases = gameData.starbases.filter(s => isInQuadrant(s, quadrant));
    const objects = [...filteredStars, ...filteredEnemies, ...filteredStarbases];
    if (isInQuadrant(gameData.player, quadrant)) {
        return [...objects, gameData.player];
    }
    return objects;
}

export function quadrantDistance(pos1: UniversePosition, pos2: UniversePosition) {
    const qDeltaX = pos2.quadrant.x - pos1.quadrant.x;
    const qDeltaY = pos2.quadrant.y - pos1.quadrant.y;
    return Math.sqrt(qDeltaX * qDeltaX + qDeltaY * qDeltaY);
}

export function sectorDistance(pos1: UniversePosition, pos2: UniversePosition) {
    const sDeltaX = (pos2.sector.x / (GameConstants.Map.sectorSize.width-1)) - (pos1.sector.x / (GameConstants.Map.sectorSize.width-1));
    const sDeltaY = (pos2.sector.y / (GameConstants.Map.sectorSize.height-1)) - (pos1.sector.y / (GameConstants.Map.sectorSize.height-1));
    return Math.sqrt(sDeltaX * sDeltaX + sDeltaY * sDeltaY);
}

export function distanceBetween(pos1: UniversePosition, pos2: UniversePosition) {
    const qDistance = quadrantDistance(pos1, pos2);
    const sDistance = sectorDistance(pos1, pos2);

    return qDistance + sDistance;
}
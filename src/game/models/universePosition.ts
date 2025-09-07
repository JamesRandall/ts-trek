import * as GameConstants from '../gameConstants.ts';

export type UniversePosition = {
    quadrant: { x: number; y: number };
    sector: { x: number; y: number };
}

export function isValidUniversePosition(position: UniversePosition) {
    return position.quadrant.x >= 0 &&
        position.quadrant.x < GameConstants.Map.quadrantSize.width &&
        position.quadrant.y >= 0 &&
        position.quadrant.y < GameConstants.Map.quadrantSize.height &&
        position.sector.x >= 0 &&
        position.sector.x < GameConstants.Map.sectorSize.width &&
        position.sector.y >= 0 &&
        position.sector.y < GameConstants.Map.sectorSize.height;
}

export function arePositionsEqual(pos1: UniversePosition, pos2: UniversePosition): boolean {
    return pos1.quadrant.x === pos2.quadrant.x &&
        pos1.quadrant.y === pos2.quadrant.y &&
        pos1.sector.x === pos2.sector.x &&
        pos1.sector.y === pos2.sector.y;
}

export function uniqueRandomPositionFactory() {
    const usedPositions = new Map<string,boolean>();
    const getPositionKey = (p:UniversePosition) => `${p.quadrant.x}_${p.quadrant.y}_${p.sector.x}_${p.sector.y}_${p.sector.y}`;

    return () => {
        let position = { quadrant: { x: -1, y: -1}, sector: { x: -1, y: -1 } };
        while (!isValidUniversePosition(position) || usedPositions.has(getPositionKey(position))) {
            position = {
                quadrant: {
                    x: Math.floor(Math.random() * GameConstants.Map.quadrantSize.width),
                    y: Math.floor(Math.random() * GameConstants.Map.quadrantSize.height),
                },
                sector: {
                    x: Math.floor(Math.random() * GameConstants.Map.sectorSize.width),
                    y: Math.floor(Math.random() * GameConstants.Map.sectorSize.height),
                }
            }
        }
        usedPositions.set(getPositionKey(position), true);
        return position;
    }
}
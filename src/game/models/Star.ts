import type {UniversePosition} from "./universePosition.ts";
import {type GameObject, GameObjectType} from "./gameObject.ts";

export const createStar = (position: UniversePosition) : GameObject => ({
    id: crypto.randomUUID(),
    type: GameObjectType.Star,
    position,
    rotation: 0
});

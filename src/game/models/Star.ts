import type {UniversePosition} from "./universePosition.ts";
import {type GameObject, GameObjectType} from "./gameObject.ts";

export class Star implements GameObject {
    readonly id = crypto.randomUUID();
    position: UniversePosition;
    rotation = 0;
    type = GameObjectType.Star;

    constructor(position: UniversePosition) {
        this.position = position;
    }
}
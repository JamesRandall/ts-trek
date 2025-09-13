import type {UniversePosition} from "./universePosition.ts";
import {type GameObject, GameObjectType} from "./gameObject.ts";
import {createRangedValue, type RangedValue} from "./RangedValue.ts";

export type PlayerShipSystem = {
    label: string;
    status: RangedValue;
    isRepairPrioritised: boolean;
}

export type PlayerAttributes = {
    energy: RangedValue;
    warpSpeed: RangedValue;
    targetQuadrant: { x: number; y: number };
    isDocked: boolean;
    shields: {
        fore: RangedValue;
        aft: RangedValue;
        port: RangedValue;
        starboard: RangedValue;
        raised: boolean;
    };
    systems: {
        hull: PlayerShipSystem;
        sensors: PlayerShipSystem;
        computer: PlayerShipSystem;
        deflectors: PlayerShipSystem;
        communications: PlayerShipSystem;
        warpEngines: PlayerShipSystem;
        impulseDrives: PlayerShipSystem;
        shieldGenerators: PlayerShipSystem;
        torpedoTubes: PlayerShipSystem;
        lasers: PlayerShipSystem;
        lifeSupport: PlayerShipSystem;
        energyConverter: PlayerShipSystem;
    },
    crew: RangedValue;
    weapons: {
        targetGameObjectIds: string[];
        torpedoes: RangedValue;
        laserPower: RangedValue;
        laserTemperature: RangedValue;
    }
}

export const playerAttributes = () : PlayerAttributes => ({
    energy: createRangedValue(3000),
    warpSpeed: createRangedValue(7,10, 1),
    targetQuadrant: { x: -1, y: -1 },
    isDocked: false,
    shields: {
        fore: createRangedValue(500),
        starboard: createRangedValue(500),
        aft: createRangedValue(500),
        port: createRangedValue(500),
        raised: false
    },
    systems: {
        hull: { label: 'Hull', status: createRangedValue(750), isRepairPrioritised: false },
        sensors: { label: 'Sensors', status: createRangedValue(200,200), isRepairPrioritised: false },
        computer: { label: 'Computer', status: createRangedValue(200), isRepairPrioritised: false },
        deflectors: { label: 'Deflectors', status: createRangedValue(200), isRepairPrioritised: false },
        warpEngines: { label: 'Warp engines', status: createRangedValue(300), isRepairPrioritised: false },
        impulseDrives: { label: 'Impulse drive', status: createRangedValue(300), isRepairPrioritised: false },
        shieldGenerators: { label: 'Shield generators', status: createRangedValue(200), isRepairPrioritised: false },
        communications: { label: 'Communications', status: createRangedValue(200), isRepairPrioritised: false },
        lifeSupport: { label: 'Life support', status: createRangedValue(300), isRepairPrioritised: false },
        energyConverter: { label: 'Energy converter', status: createRangedValue(200), isRepairPrioritised: false },
        torpedoTubes: { label: 'Torpedo tubes', status: createRangedValue(300), isRepairPrioritised: false },
        lasers: { label: 'Lasers', status: createRangedValue(200), isRepairPrioritised: false }
    },
    crew: createRangedValue(323),
    weapons: {
        targetGameObjectIds: [],
        torpedoes: createRangedValue(9),
        laserPower: createRangedValue(375, 750),
        laserTemperature: createRangedValue(0,1500)
    }
})

export function getDamageableSystemsAsArray(player:Player) {
    return Object.entries(player.attributes.systems).map(([key, value]) => ({...value, key}));
}

export function isPlayerDestroyed(player:Player) {
    return player.attributes.systems.hull.status.currentValue <= 0;
}

export interface Player extends GameObject {
    attributes: PlayerAttributes;
}

export const createPlayer = (position: UniversePosition, attributes: PlayerAttributes) : Player => ({
    id: crypto.randomUUID(),
    type: GameObjectType.Player,
    position,
    attributes: {...attributes, targetQuadrant:{...position.quadrant} },
    rotation: 0,
})

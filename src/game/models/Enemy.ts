import type { AssetManager } from "../AssetManager.tsx";
import {createRangedValue, type RangedValue} from "./RangedValue.ts";
import type {UniversePosition} from "./universePosition.ts";
import {type GameObject, GameObjectType} from "./gameObject.ts";

export type EnemyAttributes = {
    hull: RangedValue;
    shields: RangedValue;
    energy: RangedValue;
    torpedoes: RangedValue;
    maxPhaserPower: number;
}

export const EnemyType = {
    Scout: 'Scout',
    Warbird: 'Warbird',
    Cube: 'Cube'
} as const;

export type EnemyType = typeof EnemyType[keyof typeof EnemyType];

export interface Enemy extends GameObject {
    enemyType: EnemyType;
    attributes: EnemyAttributes,
    title: string;
    phaserSource: {x: number, y: number}[];
}

const createEnemy = (position: UniversePosition, enemyType: EnemyType, attributes: EnemyAttributes, title: string) : Enemy => ({
    id: crypto.randomUUID(),
    type: GameObjectType.Enemy,
    position,
    attributes,
    rotation: 0,
    asset: (assetManager: AssetManager | null) => {
        if (!assetManager) return null;
        switch (enemyType) {
            case EnemyType.Cube: return assetManager.enemyCube;
            case EnemyType.Scout: return assetManager.enemyScout;
            case EnemyType.Warbird: return assetManager.enemyWarbird;
        }
    },
    enemyType,
    title: title,
    phaserSource: enemyType === EnemyType.Scout ? [{x:200, y:420}, {x:824, y:420}] :
        enemyType === EnemyType.Warbird ? [{x:140, y:414}, {x:884, y:414}] :
            enemyType === EnemyType.Cube ? [{x:343, y:568}] : []
});

export const createScout = (position: UniversePosition) : Enemy =>
    createEnemy(
        position,
        EnemyType.Scout,
        {
            hull: createRangedValue(100),
            shields: createRangedValue(200),
            energy: createRangedValue(750),
            torpedoes: createRangedValue(0),
            maxPhaserPower: 150
        },
        'Scout');

export const createWarbird = (position: UniversePosition) : Enemy =>
    createEnemy(
        position,
        EnemyType.Warbird,
        {
            hull: createRangedValue(200),
            shields: createRangedValue(350),
            energy: createRangedValue(1500),
            torpedoes: createRangedValue(3),
            maxPhaserPower: 300
        },
        'Warbird');

export const createCube = (position: UniversePosition) : Enemy =>
    createEnemy(
        position,
        EnemyType.Cube,
        {
            hull: createRangedValue(800),
            shields: createRangedValue(1500),
            energy: createRangedValue(4500),
            torpedoes: createRangedValue(9),
            maxPhaserPower: 700
        },
        'Cubus');
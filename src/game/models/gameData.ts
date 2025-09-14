import type {Enemy} from "./Enemy.ts";
import type {Starbase} from "./Starbase.ts";
import type {Player} from "./Player.ts";
import type {GameObject} from "./gameObject.ts";

export const GameState = {
    PlayerTurn: 'PlayerTurn',
    EnemyTurn: 'EnemyTurn'
} as const;

export type GameState = typeof GameState[keyof typeof GameState];

export const FiringSequenceActionType = {
    Phasers: 'Phasers',
    Torpedoes: 'Torpedoes',
    Destroyed: 'Destroyed'
} as const;

export type FiringSequenceActionType = typeof FiringSequenceActionType[keyof typeof FiringSequenceActionType];

export const GameLogLevel = {
    Green: 'green',
    Yellow: 'yellow',
    Red: 'red'
} as const;

export type GameLogLevel = typeof GameLogLevel[keyof typeof GameLogLevel];

export const GameOverState = {
    No: 'no',
    Victory: 'victory',
    Defeat: 'defeat'
} as const;

export type GameOverState = typeof GameOverState[keyof typeof GameOverState];

export type GameLog = {
    message: string,
    stardate: string,
    level: GameLogLevel
};


export type WarpConstants = {
    warpMovementCostPerQuadrantAtWarp10: number;
    warpMovementCostPerQuadrantAtWarp1: number;
    energyGenerationPerQuadrant: number;
    chanceOfEnemyGettingFirstTurnInNewQuadrant: number;
    shieldsLoweredGenerationMultiplier: number;
}

export type ImpulseConstants = {
    impulseMovementCostPerQuadrant: number;
}

export type PlayerWeaponConstants = {
    phaserOnShieldsMultiplier: number;
    phaserOnHullMultiplier: number;
    torpedoOnShieldsMultiplier: number;
    torpedoOnHullMultiplier: number;
    torpedoDamage: number;
}

export type RepairConstants = {
    percentageOfMaxCrewCanUndertakeRepairs: number;
    repairRatePerCrewMemberPerDay: number;
}

export type EnemyWeaponConstants = {
    phaserOnShieldsMultiplier: number;
    phaserOnHullMultiplier: number;
}

export type DifficultyConstants = {
    warp: WarpConstants;
    impulse: ImpulseConstants;
    playerWeapons: PlayerWeaponConstants;
    repair: RepairConstants;
    enemyWeaponConstants: EnemyWeaponConstants;
}

export type GameData = {
    difficultyConstants: DifficultyConstants;
    stardate: number;
    state: GameState;
    player: Player;
    stars: GameObject[];
    enemies: Enemy[];
    starbases: Starbase[];
    selectedGameObject: GameObject | null;
    firingSequence: { type: FiringSequenceActionType, targetId: string }[];
    quadrantMapped: boolean[][];
    isWarping: boolean;
    logs: GameLog[];
    sensorImpactedGameObjectIds: string[];
    gameOver: GameOverState;
    canRepair: boolean;
    canFirePhasers: boolean;
    canFireTorpedoes: boolean;
}

import type {Enemy} from "./Enemy.ts";
import type {Starbase} from "./Starbase.ts";
import type {Player} from "./Player.ts";
import type {GameObject} from "./gameObject.ts";
import type {ScoreTracker} from "./scores.ts";

export const GameTurn = {
    PlayerTurn: 'PlayerTurn',
    EnemyTurn: 'EnemyTurn'
} as const;

export type GameTurn = typeof GameTurn[keyof typeof GameTurn];

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

export const GameState = {
    NoGame: 'noGame',
    InProgress: 'inProgress',
    Victory: 'victory',
    Defeat: 'defeat'
} as const;

export type GameState = typeof GameState[keyof typeof GameState];

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
    phaserPowerTemperatureMultiplier: number;
    torpedoOnShieldsMultiplier: number;
    torpedoOnHullMultiplier: number;
    torpedoDamage: number;
    percentageChanceOfMiss: number;
    percentageChanceOfMissWhenTargetSensorImpaired: number;
}

export type RepairConstants = {
    percentageOfMaxCrewCanUndertakeRepairs: number;
    repairRatePerCrewMemberPerDay: number;
    dockedRepairMultiplier: number;
}

export type EnemyWeaponConstants = {
    phaserOnShieldsMultiplier: number;
    phaserOnHullMultiplier: number;
}

export type ScoringConstants = {
    deductedPointsPerStardate: -1,
    destroyedScoutPoints: 5,
    destroyedWarbirdPoints: 10,
    destroyedCubusPoints: 50,
    destructionPenalty: -250
}

export type DifficultyConstants = {
    warp: WarpConstants;
    impulse: ImpulseConstants;
    playerWeapons: PlayerWeaponConstants;
    repair: RepairConstants;
    enemyWeaponConstants: EnemyWeaponConstants;
    scoring: ScoringConstants;
}

export type GameData = {
    difficultyConstants: DifficultyConstants;
    startingStardate: number;
    stardate: number;
    state: GameTurn;
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
    gameState: GameState;
    canRepair: boolean;
    canFirePhasers: boolean;
    canFireTorpedoes: boolean;
    canDock: boolean;
    scoreTracker: ScoreTracker;
}

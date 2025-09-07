import type {Enemy} from "./Enemy.ts";
import type {Starbase} from "./Starbase.ts";
import type {Player} from "./Player.ts";
import type {Star} from "./Star.ts";
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

export type GameData = {
    stardate: number;
    state: GameState;
    player: Player;
    stars: Star[];
    enemies: Enemy[];
    starbases: Starbase[];
    selectedGameObject: GameObject | null;
    firingSequence: { type: FiringSequenceActionType, targetId: string }[];
    quadrantMapped: boolean[][];
    isWarping: boolean;
    logs: GameLog[];
    sensorImpactedGameObjectIds: string[];
    gameOver: GameOverState;
}

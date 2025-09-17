import {GameState, type ScoringConstants} from "./gameData.ts";

export type ScoreTracker = {
    cubusDestroyed: number;
    scoutDestroyed: number;
    warbirdDestroyed: number;
    finalGameState: GameState | null;
}

export function calculateScores(scores: ScoreTracker, constants: ScoringConstants, startingStardate: number, currentStardate: number) {
    const scoreLines = {
        scoutDestroyed: scores.scoutDestroyed * constants.destroyedScoutPoints,
        warbirdDestroyed: scores.warbirdDestroyed * constants.destroyedWarbirdPoints,
        cubusDestroyed: scores.cubusDestroyed * constants.destroyedCubusPoints,
        timeTakenPenalty: Math.round((currentStardate - startingStardate) * constants.deductedPointsPerStardate),
        defeatPenalty: scores.finalGameState === GameState.Defeat ? constants.destructionPenalty : 0,
        totalScore: 0
    };
    scoreLines.totalScore = scoreLines.scoutDestroyed + scoreLines.warbirdDestroyed + scoreLines.cubusDestroyed + scoreLines.timeTakenPenalty + scoreLines.defeatPenalty;
    return scoreLines;
}
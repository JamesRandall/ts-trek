import type {GameStore} from "../state/store.ts";
import {GameLogLevel, GameState} from "../models/gameData.ts";

// must be called from within a store action
export function gameLog(state: GameStore, level: GameLogLevel, message: string) {
    state.gameData.logs = [...state.gameData.logs, { stardate: '', level, message }];
    if (level !== GameLogLevel.Green && state.gameData.state === GameState.EnemyTurn) {
        state.userInterface.showTipLog = true;
    }
}
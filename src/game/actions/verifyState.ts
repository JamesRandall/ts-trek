import type {GameStore} from "../state/store.ts";
import {GameState} from "../models/gameData.ts";

export function verifyState(get: () => GameStore, expectedState: GameState) {
    return get().gameData.state === expectedState;
}
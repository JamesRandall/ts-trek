import type {GameStore} from "../state/store.ts";
import {GameTurn} from "../models/gameData.ts";

export function verifyState(get: () => GameStore, expectedState: GameTurn) {
    return get().gameData.state === expectedState;
}
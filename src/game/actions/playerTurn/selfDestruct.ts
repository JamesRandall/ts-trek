import type {ContextAccessor} from "../../state/store.ts";
import {GameState} from "../../models/gameData.ts";

export function startSelfDestruct({set} : ContextAccessor) {
    set(state => {
        state.userInterface.isShowingStartSelfDestruct = false;
        state.userInterface.isDisabled = true;
        state.gameData.player.attributes.isSelfDestructActive = true;
    })
}

export function cancelSelfDestruct({set} : ContextAccessor) {
    set(state => {
        state.userInterface.isDisabled = false;
        state.userInterface.isShowingStartSelfDestruct = false
        state.gameData.player.attributes.isSelfDestructActive = false;
    });
}

export function completeSelfDestruct({set} : ContextAccessor) {
    set(state => {
        state.gameData.scoreTracker.finalGameState = GameState.Defeat;
        state.gameData.gameState = GameState.Defeat;
    });
}
import type {ContextAccessor, GameStore} from "../../state/store.ts";
import {applySensorDamage} from "../playerTurn/sensors.ts";
import {beginPlayerTurn} from "../playerTurn/endTurn.ts";

export function endTurn({set}:ContextAccessor) {
    set(state => {
        state.enemyTurn.aiActorSequence = [];
        beginPlayerTurn(state);
        state.userInterface.isDisabled = false;
    })
}

export function endActorTurn(state : ContextAccessor | GameStore) {
    const applyChange = (gameState:GameStore) => {
        gameState.enemyTurn.aiActorSequence = gameState.enemyTurn.aiActorSequence.slice(1);
        gameState.enemyTurn.currentActorAction = null;
        applySensorDamage(gameState);
    }

    if ('set' in state) {
        (state as ContextAccessor).set(gameState => {
            applyChange(gameState);
        });
    }
    else {
        applyChange(state as GameStore);
    }
}
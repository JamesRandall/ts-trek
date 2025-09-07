import {GameState} from "../../models/gameData.ts";
import type {GameStore} from "../../state/store.ts";
import {applyDeltaToRangedValue} from "../../models/RangedValue.ts";
import {objectsInQuadrant} from "../map.ts";
import {GameObjectType} from "../../models/gameObject.ts";
import {longRangeSensorScan} from "./sensors.ts";
import {updateWeaponState} from "./firingSequence.ts";
import {updateCanRepair} from "./repair.ts";

const phaserCooldown = 200;

function isEnemyTurn(state: GameStore) {
    const gameObjects = objectsInQuadrant(state.gameData);
    const hasEnemy = gameObjects.find(go => go.type === GameObjectType.Enemy);
    return hasEnemy !== undefined;
}

function buildEnemyAiSequence(state: GameStore) {
    state.enemyTurn.aiActorSequence =
        objectsInQuadrant(state.gameData).filter(go => go.type === GameObjectType.Enemy).map(e => e.id);
}

// Must be called from within an immer state setter
export function endTurn(state: GameStore) {
    // Ultimately we need to check and see if the player has won or lost and move to the appropriate state based on that
    applyDeltaToRangedValue(state.gameData.player.attributes.weapons.laserTemperature, -phaserCooldown);
    longRangeSensorScan(state);
    if (isEnemyTurn(state)) {
        buildEnemyAiSequence(state);
        state.userInterface.isDisabled = true;
        state.gameData.state = GameState.EnemyTurn;
    }
    else {
        state.userInterface.isDisabled = false;
        beginPlayerTurn(state);
    }
}

export function beginPlayerTurn(state: GameStore) {
    state.gameData.state = GameState.PlayerTurn;
    updateWeaponState(state);
    updateCanRepair(state);
}
import type {ContextAccessor, ReadonlyContextAccessor} from "../../state/store.ts";
import type {GameObject} from "../../models/gameObject.ts";
import {verifyState} from "../verifyState.ts";
import {GameState} from "../../models/gameData.ts";
import {updateWeaponState} from "./firingSequence.ts";
import * as GameConstants from "../../gameConstants.ts";

export function maximumTargets({ get}: ReadonlyContextAccessor) {
    return Math.round(get().gameData.player.attributes.systems.sensors.status.fraction() * 3);
}

export function canAddTarget({ get }: ReadonlyContextAccessor) {
    const player = get().gameData.player;
    const maxTargets = maximumTargets({get});
    return player.attributes.weapons.targetGameObjectIds.length < maxTargets;
}

export function addTarget({ get, set }: ContextAccessor, target: GameObject, numberOfTimes?:number) {
    if (!verifyState(get, GameState.PlayerTurn)) { return; }
    if (!canAddTarget({get})) { return; }
    set((state) => {
        for(let i = 0; i < (numberOfTimes ?? 1); i++) {
            if (state.gameData.player.attributes.weapons.targetGameObjectIds.length >= GameConstants.Rules.maximumTargets) {
                break;
            }
            state.gameData.player.attributes.weapons.targetGameObjectIds.push(target.id);
        }

        state.gameData.selectedGameObject = null;
        updateWeaponState(state);
    });
}

export function removeTarget({ get, set }: ContextAccessor, target: GameObject|number) {
    if (!verifyState(get, GameState.PlayerTurn)) { return; }
    set((state) => {
        if (typeof target === "number") {
            const targetIndex = target;
            if (targetIndex >= 0 && targetIndex < state.gameData.player.attributes.weapons.targetGameObjectIds.length) {
                state.gameData.player.attributes.weapons.targetGameObjectIds.splice(targetIndex, 1);
            }
        } else {
            state.gameData.player.attributes.weapons.targetGameObjectIds =
                state.gameData.player.attributes.weapons.targetGameObjectIds.filter(id => id !== target.id);
            state.gameData.selectedGameObject = null;
        }

        updateWeaponState(state);
    });
}

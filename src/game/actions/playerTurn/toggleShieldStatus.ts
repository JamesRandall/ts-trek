import {GameTurn} from "../../models/gameData.ts";
import type {ContextAccessor} from "../../state/store.ts";
import {verifyState} from "../verifyState.ts";
import * as GameConstants from "../../gameConstants.ts";
import {updateDockingState} from "./docking.ts";

export function toggleShieldStatus({ get, set}: ContextAccessor) {
    if (!verifyState(get, GameTurn.PlayerTurn)) { return; }
    if (!get().gameData.player.attributes.shields.raised &&
        get().gameData.player.attributes.systems.shieldGenerators.status.fraction() < GameConstants.Rules.criticalDamageThreshold ) {
        return;
    }

    set((state) => {
        if (state.gameData.player.attributes.isDocked) {
            state.gameData.player.attributes.shields.raised = false;
            return;
        }
        state.gameData.player.attributes.shields.raised = !state.gameData.player.attributes.shields.raised;
        updateDockingState(state);
    });
}
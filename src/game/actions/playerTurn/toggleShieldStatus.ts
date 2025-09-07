import {GameState} from "../../models/gameData.ts";
import type {ContextAccessor} from "../../state/store.ts";
import {verifyState} from "../verifyState.ts";
import * as GameConstants from "../../gameConstants.ts";

export function toggleShieldStatus({ get, set}: ContextAccessor) {
    if (!verifyState(get, GameState.PlayerTurn)) { return; }
    if (!get().gameData.player.attributes.shields.raised &&
        get().gameData.player.attributes.systems.shieldGenerators.status.fraction() < GameConstants.Rules.criticalDamageThreshold ) {
        return;
    }

    set((state) => {
        state.gameData.player.attributes.shields.raised = !state.gameData.player.attributes.shields.raised;
    });
}
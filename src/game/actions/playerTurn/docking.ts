import type {ContextAccessor, GameStore} from "../../state/store.ts";
import {endTurn} from "./endTurn.ts";
import * as GameConstants from "../../gameConstants.ts";
import {objectsInQuadrant} from "../map.ts";
import {GameObjectType} from "../../models/gameObject.ts";
import {gameLog} from "../logs.ts";
import {GameLogLevel} from "../../models/gameData.ts";
import type {Starbase} from "../../models/Starbase.ts";
import {updateWeaponState} from "./firingSequence.ts";
import {updateCanRepair} from "./repair.ts";

function getStarbase(state: GameStore) {
    const starbasesInSector = objectsInQuadrant(state.gameData).filter(go => go.type === GameObjectType.Starbase);
    if (starbasesInSector.length === 0) {
        state.gameData.canDock = false;
        return;
    }
    const starbase = starbasesInSector[0]; // only one per starbase per quadrant
    return starbase as Starbase;
}

function resupply(state: GameStore) {
    const player = state.gameData.player;
    const weapons = player.attributes.weapons;
    const starbase = getStarbase(state);
    if (!starbase) { return; }
    const torpedosToResupply = Math.min(weapons.torpedoes.maxValue - weapons.torpedoes.currentValue, starbase.attributes.torpedoStocks.currentValue);
    const energyToResupply = Math.min(player.attributes.energy.maxValue - player.attributes.energy.currentValue, starbase.attributes.energy.currentValue);

    weapons.torpedoes.currentValue += torpedosToResupply;
    player.attributes.energy.currentValue += energyToResupply;
    starbase.attributes.torpedoStocks.currentValue -= torpedosToResupply;
    starbase.attributes.energy.currentValue -= energyToResupply;
}

export function dock({get,set} : ContextAccessor)
{
    if (!get().gameData.canDock) { return; }
    set((state) => {
       state.gameData.player.attributes.isDocked = true;
       state.gameData.selectedGameObject = null;
       resupply(state);
       gameLog(state, GameLogLevel.Green, 'Docked with starbase and resupplied, weapons offline');
       endTurn(state);
    });
}

export function undock({get,set} : ContextAccessor)
{
    if (!get().gameData.player.attributes.isDocked) { return; }
    set((state) => {
        state.gameData.player.attributes.isDocked = false;
        state.gameData.selectedGameObject = null;
        updateWeaponState(state);
        updateCanRepair(state);
        updateDockingState(state);
        gameLog(state, GameLogLevel.Green, 'Undocked, weapons online');
    })
}

export function updateDockingState(state: GameStore) {
    const playerPosition = state.gameData.player.position;
    const playerShields = state.gameData.player.attributes.shields.raised;
    const comms = state.gameData.player.attributes.systems.communications;
    const starbase = getStarbase(state);
    if (!starbase) {
        state.gameData.canDock = false;
        return;
    }

    state.gameData.canDock =
        comms.status.fraction() >= GameConstants.Rules.criticalDamageThreshold &&
        playerPosition.sector.x >= (starbase.position.sector.x-1) &&
        playerPosition.sector.x <= (starbase.position.sector.x+1) &&
        playerPosition.sector.y >= (starbase.position.sector.y-1) &&
        playerPosition.sector.y <= (starbase.position.sector.y+1) &&
        !playerShields;
}
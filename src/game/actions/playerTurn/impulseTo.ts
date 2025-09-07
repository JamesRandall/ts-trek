import type {ContextAccessor, ReadonlyContextAccessor} from "../../state/store.ts";
import {verifyState} from "../verifyState.ts";
import {GameState} from "../../models/gameData.ts";
import type {UniversePosition} from "../../models/universePosition.ts";
import {distanceBetween, objectAtPosition} from "../map.ts";
import {endTurn} from "./endTurn.ts";
import {passTime} from "./time.ts";

const impulseMovementCostPerQuadrant = 75.0;

const isBlocked = (ctx: ReadonlyContextAccessor, universePosition: UniversePosition) =>
    objectAtPosition(ctx, universePosition) !== undefined;

export function impulseTo({ get, set}: ContextAccessor, sector:{x:number,y:number}) {
    if (!verifyState(get, GameState.PlayerTurn)) { return; }
    const player = get().gameData.player;
    if (isBlocked({get}, { ...player.position, sector })) { return; }

    const distance = distanceBetween(player.position, { ...player.position, sector });
    const energyCost = distance * impulseMovementCostPerQuadrant / player.attributes.systems.impulseDrives.status.fraction();
    if (energyCost > player.attributes.energy.currentValue) {
        return;
    }

    set((state) => {
        passTime(state, 0.1);
        state.gameData.player.position = { ...player.position, sector };
        state.gameData.player.attributes.energy.currentValue -= energyCost;
        endTurn(state);
    });
}

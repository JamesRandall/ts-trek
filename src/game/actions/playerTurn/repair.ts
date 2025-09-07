import type {ContextAccessor, GameStore, ReadonlyContextAccessor} from "../../state/store.ts";
import type {PlayerShipSystem} from "../../models/Player.ts";
import type {RangedValue} from "../../models/RangedValue.ts";
import {endTurn} from "./endTurn.ts";
import {objectsInQuadrant} from "../map.ts";
import {GameObjectType} from "../../models/gameObject.ts";

const percentageOfMaxCrewCanUndertakeRepairs = 0.25;
const repairRatePerCrewMemberPerDay = 0.5;

function calculateDailyRepairPoints(crew: RangedValue) {
    const availableCrew = crew.currentValue;
    return availableCrew * percentageOfMaxCrewCanUndertakeRepairs * repairRatePerCrewMemberPerDay;
}

function calculateRepairCosts(crew: RangedValue, systems: PlayerShipSystem[]) {
    const totalDamage = systems.reduce((acc,s) => acc + (s.status.maxValue - s.status.currentValue), 0);
    return totalDamage / calculateDailyRepairPoints(crew);
}

export function togglePrioritisedSystem({set}: ContextAccessor, systemKey: string) {
    set(state => {
        const system = Object.entries(state.gameData.player.attributes.systems).find(([k]) => k === systemKey);
        if (system) {
            system[1].isRepairPrioritised = !system[1].isRepairPrioritised;
        }
    })
}

export function calculatePrioritisedRepairCosts({get}: ReadonlyContextAccessor) {
    const player = get().gameData.player;
    const prioritisedSystems =
        Object
            .entries(player.attributes.systems)
            .filter(([k,v]) => v.isRepairPrioritised && (k !== 'hull' || player.attributes.isDocked))
            .map(kvp => kvp[1]);
    return calculateRepairCosts(player.attributes.crew, prioritisedSystems);
}

export function calculateNonPrioritisedRepairCosts({get}: ReadonlyContextAccessor) {
    const player = get().gameData.player;
    const prioritisedSystems =
        Object
            .entries(player.attributes.systems)
            .filter(([k,v]) => !v.isRepairPrioritised && (k !== 'hull' || player.attributes.isDocked))
            .map(kvp => kvp[1]);
    return calculateRepairCosts(player.attributes.crew, prioritisedSystems);
}

export function applyRepairForTime(state:GameStore, time: number) {
    const player = state.gameData.player;
    const dailyRepairPoints = calculateDailyRepairPoints(player.attributes.crew);
    let remainingRepairPoints = dailyRepairPoints * time;

    // Helper function to apply repair points to a list of systems
    const repairSystems = (systems: PlayerShipSystem[]) => {
        while (remainingRepairPoints > 0) {
            // Find systems that still need repair
            const damagedSystems = systems.filter(system =>
                system.status.currentValue < system.status.maxValue
            );

            // If no systems need repair, break out
            if (damagedSystems.length === 0) {
                break;
            }

            // Distribute points evenly among damaged systems
            const pointsPerSystem = remainingRepairPoints / damagedSystems.length;
            let pointsUsedThisRound = 0;

            for (const system of damagedSystems) {
                const damageRemaining = system.status.maxValue - system.status.currentValue;
                const pointsToApply = Math.min(pointsPerSystem, damageRemaining);

                system.status.currentValue += pointsToApply;
                pointsUsedThisRound += pointsToApply;
            }

            remainingRepairPoints -= pointsUsedThisRound;

            // If we didn't use any points this round, break to prevent infinite loop
            if (pointsUsedThisRound === 0) {
                break;
            }
        }
    };

    // First repair prioritised systems
    const prioritisedSystems =
        Object
            .entries(player.attributes.systems)
            .filter(([k,v]) =>
                v.isRepairPrioritised && v.status.currentValue < v.status.maxValue && (k !== 'hull' || player.attributes.isDocked))
            .map(kvp => kvp[1]);

    repairSystems(prioritisedSystems);

    // If there are remaining points, repair non-prioritised systems
    if (remainingRepairPoints > 0) {
        const nonPrioritisedSystems =
            Object
                .entries(player.attributes.systems)
                .filter(([k,v]) =>
                    !v.isRepairPrioritised && v.status.currentValue < v.status.maxValue && (k !== 'hull' || player.attributes.isDocked))
                .map(kvp => kvp[1]);

        repairSystems(nonPrioritisedSystems);
    }
}

export function repair(stateAccess: ContextAccessor | GameStore, time: number) {
    const handleRepair = (state:GameStore) => {
        applyRepairForTime(state, time);
        state.gameData.stardate += time;
        endTurn(state);
    }

    if ('set' in stateAccess) {
        (stateAccess as ContextAccessor).set(handleRepair);
    } else {
        handleRepair(stateAccess as GameStore);
    }
}

export function updateCanRepair(state:GameStore) {
    const enemiesInQuadrant = objectsInQuadrant(state.gameData).filter(go => go.type === GameObjectType.Enemy);
    state.playerTurn.canRepair = enemiesInQuadrant.length === 0;
}
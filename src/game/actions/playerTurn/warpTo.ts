import type {ContextAccessor, ReadonlyContextAccessor} from "../../state/store.ts";
import {verifyState} from "../verifyState.ts";
import {type GameData, GameState} from "../../models/gameData.ts";
import {quadrantDistance} from "../map.ts";
import {endTurn} from "./endTurn.ts";
import {passTime} from "./time.ts";
import {applySensorDamage, longRangeSensorScan} from "./sensors.ts";

const warpMovementCostPerQuadrantAtWarp10 = 600.0;
const warpMovementCostPerQuadrantAtWarp1 = 10.0;
const energyGenerationPerQuadrant = 100.0;
const chanceOfEnemyGettingFirstTurnInNewQuadrant = 0.25;
const shieldsLoweredGenerationMultiplier = 1.2;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Energy consumption curve:
 * - warp in [1, 10]
 * - energy in [10, 400]
 * - steep near 1 and 10, flatter in the middle
 * a controls steepness near the ends: 0 < a < 1 (e.g., 0.5 for "square root")
 */
function baseEnergyAtWarp(warp: number, a: number) : number {
    const minCost = warpMovementCostPerQuadrantAtWarp1;   // e.g., 10
    const maxCost = warpMovementCostPerQuadrantAtWarp10;  // e.g., 700

    const w = clamp(warp, 1, 10);
    const s = (w - 1) / 9; // normalize to [0,1]
    const t = 0.5 * (Math.pow(s, a) + 1 - Math.pow(1 - s, a)); // in [0,1], steep at both ends

    // Anchor warp=4 to generation
    const s4 = (4 - 1) / 9;
    const t4 = 0.5 * (Math.pow(s4, a) + 1 - Math.pow(1 - s4, a));

    const targetAt4 = energyGenerationPerQuadrant; // e.g., 100
    const normTarget = (targetAt4 - minCost) / (maxCost - minCost);

    // Compute exponent k so that (t4^k) == normTarget, with guards
    const safeT4 = Math.max(1e-6, Math.min(1 - 1e-6, t4));
    const safeNormTarget = Math.max(1e-6, Math.min(1 - 1e-6, normTarget));
    const k = Math.log(safeNormTarget) / Math.log(safeT4);

    const u = Math.pow(t, k); // transformed curve still in [0,1], preserves endpoints
    return minCost + (maxCost - minCost) * u;

}


function engineHealthMultiplier(engineHealth: number, exponent = 2): number {
    if (engineHealth < 0.1) return Number.POSITIVE_INFINITY;
    const h = clamp(engineHealth, 0.1, 1.0);
    const s = (1 - h) / 0.9; // map h=[1..0.1] to s=[0..1]
    const minMult = 1.0;
    const maxMult = 3.0;
    return minMult + (maxMult - minMult) * Math.pow(s, exponent);
}

function energyConsumptionAtWarp(warp: number, engineHealth: number, a = 0.98): number {
    const base = baseEnergyAtWarp(warp, a);
    const healthMult = engineHealthMultiplier(engineHealth);
    if (!Number.isFinite(healthMult)) return Number.POSITIVE_INFINITY;
    return base * healthMult;
}

function calculateEnergyDelta(gameData: GameData, specifiedDistance?: number) {
    const distance = specifiedDistance ?? quadrantDistance(gameData.player.position, {...gameData.player.position, quadrant: gameData.player.attributes.targetQuadrant});
    const warp = gameData.player.attributes.warpSpeed.currentValue;
    const engineHealth = gameData.player.attributes.systems.warpEngines.status.fraction();

    const consumption = energyConsumptionAtWarp(warp, engineHealth) * distance;
    const generated = energyGenerationPerQuadrant * distance * (gameData.player.attributes.shields.raised ? 1.0 : shieldsLoweredGenerationMultiplier);

    return generated - consumption;
}

function calculateTimeToTravel(gameData: GameData, specifiedDistance?: number) {
    const distance = specifiedDistance ?? quadrantDistance(gameData.player.position, {...gameData.player.position, quadrant: gameData.player.attributes.targetQuadrant});
    const warp = gameData.player.attributes.warpSpeed.currentValue;

    // Time requirements: warp 1 = 3 days/unit, warp 5 = 1 day/unit, warp 10 = 0.1 days/unit
    const timeAtWarp1 = 3.0;   // days per unit
    const timeAtWarp10 = 0.1;  // days per unit

    const w = clamp(warp, 1, 10);
    const s = (w - 1) / 9; // normalize to [0,1]
    const a = 0.5; // steepness parameter for curve shape
    const t = 0.5 * (Math.pow(s, a) + 1 - Math.pow(1 - s, a)); // steep at both ends

    // Anchor warp=5 to 1 day per unit
    const s5 = (5 - 1) / 9; // s5 = 4/9
    const t5 = 0.5 * (Math.pow(s5, a) + 1 - Math.pow(1 - s5, a));

    const targetAt5 = 1.0; // 1 day per unit at warp 5
    const normTarget = (targetAt5 - timeAtWarp1) / (timeAtWarp10 - timeAtWarp1);

    // Compute exponent k so that (t5^k) == normTarget, with guards
    const safeT5 = Math.max(1e-6, Math.min(1 - 1e-6, t5));
    const safeNormTarget = Math.max(1e-6, Math.min(1 - 1e-6, normTarget));
    const k = Math.log(safeNormTarget) / Math.log(safeT5);

    const u = Math.pow(t, k);
    const timePerUnit = timeAtWarp1 + (timeAtWarp10 - timeAtWarp1) * u;

    return timePerUnit * distance;

}

export function canWarpTo({ get }: ReadonlyContextAccessor, quadrant: {x:number, y:number}) {
    const player = get().gameData.player;
    const distance = quadrantDistance(player.position, {...player.position, quadrant: quadrant});
    const energyDelta = calculateEnergyDelta(get().gameData, distance);

    return (energyDelta + get().gameData.player.attributes.energy.currentValue) >= 0;
}

export function beginWarpTo({ get, set}: ContextAccessor) {
    if (!verifyState(get, GameState.PlayerTurn)) { return; }
    const energyDelta = calculateEnergyDelta(get().gameData);
    if (energyDelta + get().gameData.player.attributes.energy.currentValue < 0) {
        return;
    }

    set((state) => {
        state.gameData.isWarping = true;
    });
}

export function endWarpTo({ get, set}: ContextAccessor) {
    if (!verifyState(get, GameState.PlayerTurn)) { return; }
    set((state) => {
        const timeToTravel = calculateTimeToTravel(state.gameData);
        const energyDelta = calculateEnergyDelta(get().gameData);
        const newEnergy = clamp(
            state.gameData.player.attributes.energy.currentValue + energyDelta,
            0,
            state.gameData.player.attributes.energy.maxValue
        );

        passTime(state, timeToTravel);
        state.userInterface.isShowingLongRangeScanner = false;
        state.userInterface.gameObjectRotations = {};
        state.gameData.player.attributes.energy.currentValue = newEnergy;
        state.gameData.player.attributes.weapons.targetGameObjectIds = [];
        state.gameData.isWarping = false;
        state.gameData.player.position.quadrant = state.gameData.player.attributes.targetQuadrant;
        state.gameData.sensorImpactedGameObjectIds = [];

        applySensorDamage(state);
        longRangeSensorScan(state);

        if (Math.random() < chanceOfEnemyGettingFirstTurnInNewQuadrant) {
            endTurn(state);
        }
    });
}

export function setWarpSpeed({set}:ContextAccessor, warpSpeed: number) {
    set((state) => {
        state.gameData.player.attributes.warpSpeed.currentValue = clamp(warpSpeed, 1, 10);
    });
}
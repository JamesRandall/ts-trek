import type {ContextAccessor, GameStore} from "../../state/store.ts";
import type {Enemy} from "../../models/Enemy.ts";
import type {Player} from "../../models/Player.ts";
import {FiringSequenceActionType, GameState} from "../../models/gameData.ts";
import {endTurn} from "./endTurn.ts";
import {verifyState} from "../verifyState.ts";
import {passTime} from "./time.ts";
import * as GameConstants from "../../gameConstants.ts";
import {applyDeltaToRangedValue} from "../../models/RangedValue.ts";

const phaserOnShieldsMultiplier = 1;
const phaserOnHullMultiplier = 0.4;
const torpedoOnShieldsMultiplier = 0.2;
const torpedoOnHullMultiplier = 1;
const torpedoDamage = 800;

function applyPhaserHitToEnemy(player: Player, target: Enemy) {
    const phaserPower = Math.min(player.attributes.weapons.laserPower.currentValue, player.attributes.energy.currentValue);

    // Apply damage to shields first
    const shieldDamage = phaserPower * phaserOnShieldsMultiplier;
    const newEnemyShields = Math.max(0, target.attributes.shields.currentValue - shieldDamage);

    // Calculate remaining energy after shield damage
    const shieldDamageDealt = target.attributes.shields.currentValue - newEnemyShields;
    const remainingEnergy = phaserPower - (shieldDamageDealt / phaserOnShieldsMultiplier);

    // Apply remaining energy to hull if any
    let newEnemyHull = target.attributes.hull.currentValue;
    if (remainingEnergy > 0) {
        const hullDamage = remainingEnergy * phaserOnHullMultiplier;
        newEnemyHull = Math.max(0, target.attributes.hull.currentValue - hullDamage);
    }

    // Update the target's attributes
    target.attributes.shields.currentValue = newEnemyShields;
    target.attributes.hull.currentValue = newEnemyHull;

    // Reduce player's energy by the amount used
    player.attributes.energy.currentValue -= phaserPower;

    // Apply temperature change to the phaser
    const temperatureDelta = phaserPower * 0.4;
    player.attributes.weapons.laserTemperature.currentValue = Math.min(
        player.attributes.weapons.laserTemperature.maxValue,
        player.attributes.weapons.laserTemperature.currentValue + temperatureDelta
    )

    return target.attributes.hull.currentValue <= 0;
}

function applyTorpedoHitToEnemy(player: Player, target: Enemy) {
    const shieldDamage = torpedoDamage * torpedoOnShieldsMultiplier;
    const newEnemyShields = Math.max(0, target.attributes.shields.currentValue - shieldDamage);
    const shieldDamageDealt = target.attributes.shields.currentValue - newEnemyShields;
    const remainingDamage = torpedoDamage - (shieldDamageDealt / torpedoOnShieldsMultiplier);
    let newEnemyHull = target.attributes.hull.currentValue;
    if (remainingDamage > 0) {
        const hullDamage = remainingDamage * torpedoOnHullMultiplier;
        newEnemyHull = Math.max(0, target.attributes.hull.currentValue - hullDamage);
    }
    target.attributes.shields.currentValue = newEnemyShields;
    target.attributes.hull.currentValue = newEnemyHull;

    // Reduce players torpedo count
    applyDeltaToRangedValue(player.attributes.weapons.torpedoes, -1);

    return target.attributes.hull.currentValue <= 0;
}

export function nextFiringSequenceItem({get,set} : ContextAccessor) {
    if (!verifyState(get, GameState.PlayerTurn)) { return; }
    set((state) => {
        const head = state.gameData.firingSequence[0];
        if (!head) {
            return;
        }

        if (head.type === FiringSequenceActionType.Destroyed) {
            state.gameData.enemies = state.gameData.enemies.filter(e => e.id !== head.targetId);
            state.gameData.player.attributes.weapons.targetGameObjectIds = state.gameData.player.attributes.weapons.targetGameObjectIds.filter(t => t !== head.targetId);
        }
        else if (head.type === FiringSequenceActionType.Phasers) {
            const enemy = state.gameData.enemies.find(e => e.id === head.targetId);
            if (enemy) {
                const isEnemyDestroyed = applyPhaserHitToEnemy(state.gameData.player, enemy);
                if (isEnemyDestroyed) {
                    state.gameData.firingSequence[0].type = FiringSequenceActionType.Destroyed;
                    return;
                }
            }
        }
        else if (head.type === FiringSequenceActionType.Torpedoes) {
            const enemy = state.gameData.enemies.find(e => e.id === head.targetId);
            if (enemy) {
                const isEnemyDestroyed = applyTorpedoHitToEnemy(state.gameData.player, enemy);
                if (isEnemyDestroyed) {
                    state.gameData.firingSequence[0].type = FiringSequenceActionType.Destroyed;
                    return;
                }
            }
        }

        state.gameData.firingSequence = state.gameData.firingSequence.slice(1);
        if (state.gameData.firingSequence.length === 0) {
            passTime(state, 0.1);
            endTurn(state);
        }
    });
}

export function beginFiringSequence({get,set} : ContextAccessor, weapon: FiringSequenceActionType) {
    if (!verifyState(get, GameState.PlayerTurn)) { return; }
    set((state) => {
        state.userInterface.isDisabled = true;
        const targets = state.gameData.player.attributes.weapons.targetGameObjectIds;
        state.gameData.firingSequence = targets.map(t => ({ type: weapon, targetId: t}));
    });
}

export function updateWeaponState(state:GameStore) {
    const player = state.gameData.player;
    state.playerTurn.canFirePhasers =
        player.attributes.weapons.targetGameObjectIds.length > 0 &&
        player.attributes.weapons.laserPower.currentValue > 0 &&
        player.attributes.systems.lasers.status.fraction() >= GameConstants.Rules.criticalDamageThreshold &&
        player.attributes.systems.sensors.status.fraction() >= GameConstants.Rules.criticalDamageThreshold &&
        player.attributes.energy.currentValue > 0;

    state.playerTurn.canFireTorpedoes =
        player.attributes.weapons.targetGameObjectIds.length > 0 &&
        player.attributes.weapons.torpedoes.currentValue > 0 &&
        player.attributes.systems.torpedoTubes.status.fraction() >= GameConstants.Rules.criticalDamageThreshold &&
        player.attributes.systems.sensors.status.fraction() >= GameConstants.Rules.criticalDamageThreshold;
}

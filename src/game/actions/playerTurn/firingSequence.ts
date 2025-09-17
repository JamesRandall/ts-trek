import type {ContextAccessor, GameStore} from "../../state/store.ts";
import {type Enemy, EnemyType} from "../../models/Enemy.ts";
import {
    FiringSequenceActionType,
    GameLogLevel,
    GameTurn,
    type PlayerWeaponConstants
} from "../../models/gameData.ts";
import {endTurn} from "./endTurn.ts";
import {verifyState} from "../verifyState.ts";
import {passTime} from "./time.ts";
import * as GameConstants from "../../gameConstants.ts";
import {applyDeltaToRangedValue} from "../../models/RangedValue.ts";
import {gameLog} from "../logs.ts";

function applyPhaserHitToEnemy(constants: PlayerWeaponConstants, state:GameStore, target: Enemy) {


    const isSensorImpaired = state.gameData.sensorImpactedGameObjectIds.includes(target.id);
    const didMiss = Math.random() < (isSensorImpaired ? constants.percentageChanceOfMissWhenTargetSensorImpaired : constants.percentageChanceOfMiss);
    if (didMiss) {
        gameLog(state, GameLogLevel.Red, "Sensor malfunction caused phaser to miss target");
    }

    const player = state.gameData.player;
    const phaserPower = Math.min(player.attributes.weapons.laserPower.currentValue, player.attributes.energy.currentValue);

    if (!didMiss) {
        // Apply damage to shields first
        const shieldDamage = phaserPower * constants.phaserOnShieldsMultiplier;
        const newEnemyShields = Math.max(0, target.attributes.shields.currentValue - shieldDamage);

        // Calculate remaining energy after shield damage
        const shieldDamageDealt = target.attributes.shields.currentValue - newEnemyShields;
        const remainingEnergy = phaserPower - (shieldDamageDealt / constants.phaserOnShieldsMultiplier);

        // Apply remaining energy to hull if any
        let newEnemyHull = target.attributes.hull.currentValue;
        if (remainingEnergy > 0) {
            const hullDamage = remainingEnergy * constants.phaserOnHullMultiplier;
            newEnemyHull = Math.max(0, target.attributes.hull.currentValue - hullDamage);
        }

        // Update the target's attributes
        target.attributes.shields.currentValue = newEnemyShields;
        target.attributes.hull.currentValue = newEnemyHull;
    }

    // Reduce player's energy by the amount used
    player.attributes.energy.currentValue -= phaserPower;

    // Apply temperature change to the phaser
    const temperatureDelta = phaserPower * constants.phaserPowerTemperatureMultiplier;
    player.attributes.weapons.laserTemperature.currentValue = Math.min(
        player.attributes.weapons.laserTemperature.maxValue,
        player.attributes.weapons.laserTemperature.currentValue + temperatureDelta
    )

    return target.attributes.hull.currentValue <= 0;
}

function applyTorpedoHitToEnemy(constants: PlayerWeaponConstants, state:GameStore, target: Enemy) {
    const player = state.gameData.player;
    // Reduce players torpedo count
    applyDeltaToRangedValue(player.attributes.weapons.torpedoes, -1);

    const isSensorImpaired = state.gameData.sensorImpactedGameObjectIds.includes(target.id);
    const didMiss = Math.random() < (isSensorImpaired ? constants.percentageChanceOfMissWhenTargetSensorImpaired : constants.percentageChanceOfMiss);
    if (didMiss) {
        gameLog(state, GameLogLevel.Red, "Sensor malfunction caused torpedo to miss target");
        return false;
    }

    const shieldDamage = constants.torpedoDamage * constants.torpedoOnShieldsMultiplier;
    const newEnemyShields = Math.max(0, target.attributes.shields.currentValue - shieldDamage);
    const shieldDamageDealt = target.attributes.shields.currentValue - newEnemyShields;
    const remainingDamage = constants.torpedoDamage - (shieldDamageDealt / constants.torpedoOnShieldsMultiplier);
    let newEnemyHull = target.attributes.hull.currentValue;
    if (remainingDamage > 0) {
        const hullDamage = remainingDamage * constants.torpedoOnHullMultiplier;
        newEnemyHull = Math.max(0, target.attributes.hull.currentValue - hullDamage);
    }
    target.attributes.shields.currentValue = newEnemyShields;
    target.attributes.hull.currentValue = newEnemyHull;

    return target.attributes.hull.currentValue <= 0;
}

function updateScoreBasedOnEnemyDestroyed(state: GameStore, head: Enemy) {
    const scoreTracker = state.gameData.scoreTracker;
    switch (head.enemyType) {
        case EnemyType.Cube: scoreTracker.cubusDestroyed++; break;
        case EnemyType.Warbird: scoreTracker.warbirdDestroyed++; break;
        case EnemyType.Scout: scoreTracker.scoutDestroyed++; break;
    }
}

export function nextFiringSequenceItem({get,set} : ContextAccessor) {
    if (!verifyState(get, GameTurn.PlayerTurn)) { return; }
    set((state) => {
        const head = state.gameData.firingSequence[0];
        if (!head) {
            return;
        }
        const constants = state.gameData.difficultyConstants.playerWeapons;

        if (head.type === FiringSequenceActionType.Destroyed) {
            const enemy = state.gameData.enemies.find(e => e.id === head.targetId);
            state.gameData.enemies = state.gameData.enemies.filter(e => e.id !== head.targetId);
            state.gameData.player.attributes.weapons.targetGameObjectIds =
                state.gameData.player.attributes.weapons.targetGameObjectIds.filter(t => t !== head.targetId);
            if (enemy) {
                updateScoreBasedOnEnemyDestroyed(state, enemy);
            }
        }
        else if (head.type === FiringSequenceActionType.Phasers) {
            const enemy = state.gameData.enemies.find(e => e.id === head.targetId);
            if (enemy) {
                const isEnemyDestroyed = applyPhaserHitToEnemy(constants, state, enemy);
                if (isEnemyDestroyed) {
                    state.gameData.firingSequence[0].type = FiringSequenceActionType.Destroyed;
                    return;
                }
            }
        }
        else if (head.type === FiringSequenceActionType.Torpedoes) {
            const enemy = state.gameData.enemies.find(e => e.id === head.targetId);
            if (enemy) {
                const isEnemyDestroyed = applyTorpedoHitToEnemy(constants, state, enemy);
                if (isEnemyDestroyed) {
                    state.gameData.firingSequence[0].type = FiringSequenceActionType.Destroyed;
                    return;
                }
            }
        }

        // We need to remove the head from the sequence - but we also need to remove any destroyed targets (which
        // will be more instances of the head target, if multiple targets were added)
        state.gameData.firingSequence = state.gameData.firingSequence.slice(1).filter(f => f.targetId !== head.targetId || head.type !== FiringSequenceActionType.Destroyed);
        if (state.gameData.firingSequence.length === 0) {
            passTime(state, 0.1);
            endTurn(state);
        }
    });
}

export function beginFiringSequence({get,set} : ContextAccessor, weapon: FiringSequenceActionType) {
    if (!verifyState(get, GameTurn.PlayerTurn)) { return; }
    set((state) => {
        state.userInterface.isDisabled = true;
        const targets = state.gameData.player.attributes.weapons.targetGameObjectIds;
        state.gameData.firingSequence = targets.map(t => ({ type: weapon, targetId: t}));
    });
}

export function updateWeaponState(state:GameStore) {
    const player = state.gameData.player;
    if (player.attributes.isDocked) {
        state.gameData.canFirePhasers = false;
        state.gameData.canFireTorpedoes = false;
        return;
    }

    state.gameData.canFirePhasers =
        player.attributes.weapons.targetGameObjectIds.length > 0 &&
        player.attributes.weapons.laserPower.currentValue > 0 &&
        player.attributes.systems.lasers.status.fraction() >= GameConstants.Rules.criticalDamageThreshold &&
        player.attributes.systems.sensors.status.fraction() >= GameConstants.Rules.criticalDamageThreshold &&
        player.attributes.energy.currentValue > 0;

    state.gameData.canFireTorpedoes =
        player.attributes.weapons.targetGameObjectIds.length > 0 &&
        player.attributes.weapons.torpedoes.currentValue > 0 &&
        player.attributes.systems.torpedoTubes.status.fraction() >= GameConstants.Rules.criticalDamageThreshold &&
        player.attributes.systems.sensors.status.fraction() >= GameConstants.Rules.criticalDamageThreshold;
}

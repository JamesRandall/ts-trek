import {AiActorAction, type ContextAccessor, type GameStore} from "../../state/store.ts";
import {applyDeltaToRangedValue, type RangedValue} from "../../models/RangedValue.ts";
import type {Enemy} from "../../models/Enemy.ts";
import {getDamageableSystemsAsArray, isPlayerDestroyed} from "../../models/Player.ts";
import {gameLog} from "../logs.ts";
import {GameLogLevel} from "../../models/gameData.ts";
import * as GameConstants from "../../gameConstants.ts";
import {range} from "../../utilities.ts";

const phaserOnShieldsMultiplier = 1.2;
const phaserOnHullMultiplier = 0.7;

function getImpactedShield(state:GameStore, enemy: Enemy) : { label: string, shield: RangedValue } | null {
    const player = state.gameData.player;
    if (!player.attributes.shields.raised) { return null;}
    // Calculate the angle from player to enemy
    const dx = player.position.sector.x - enemy.position.sector.x;
    const dy = player.position.sector.y - enemy.position.sector.y;
    let angle = Math.atan2(dy, dx);

    // Convert to degrees and normalize to 0-360 range
    angle = (angle * 180 / Math.PI - 90 + 360) % 360;


    // Determine which shield based on angle
    // Assuming player faces "north" (0 degrees):
    // - Fore: 315° to 45° (front)
    // - Starboard: 45° to 135° (right)
    // - Aft: 135° to 225° (back)
    // - Port: 225° to 315° (left)

    if (angle >= 315 || angle < 45) {
        return { label: 'Fore', shield: player.attributes.shields.fore };
    } else if (angle >= 45 && angle < 135) {
        return { label: 'Starboard', shield: player.attributes.shields.starboard };
    } else if (angle >= 135 && angle < 225) {
        return { label: 'Aft', shield: player.attributes.shields.aft };
    } else {
        return { label: 'Port', shield: player.attributes.shields.port };
    }

}

export function applyPhasersToPlayer({set}: ContextAccessor) {
    set(state => {

        if (state.enemyTurn.aiActorSequence.length === 0) { return; }
        if (state.enemyTurn.currentActorAction !== AiActorAction.FirePhasers) { return; }

        const player = state.gameData.player;
        const enemy = state.gameData.enemies.find(go => go.id === state.enemyTurn.aiActorSequence[0]);
        if (!enemy) { return; }
        const halfPower = enemy.attributes.maxPhaserPower * 0.5;
        const phaserPower = Math.min(enemy.attributes.energy.currentValue, halfPower + (Math.random() * halfPower));
        let remainingEnergy = phaserPower;
        const impactedShield = getImpactedShield(state, enemy);
        if (impactedShield !== null) {
            const shieldDamage = phaserPower * phaserOnShieldsMultiplier;
            const newEnemyShields = Math.max(0, impactedShield.shield.currentValue - shieldDamage);
            const shieldDamageDealt = impactedShield.shield.currentValue - newEnemyShields;
            remainingEnergy = phaserPower - (shieldDamageDealt / phaserOnShieldsMultiplier)
            impactedShield.shield.currentValue = newEnemyShields;
            if (impactedShield.shield.currentValue <= 0) {
                gameLog(state, GameLogLevel.Red, `${impactedShield.label} shields down` );
            }
            else {
                gameLog(state, GameLogLevel.Yellow, `${impactedShield.label} shields holding` );
            }
        }
        remainingEnergy = Math.floor(remainingEnergy);

        let damageableSystems = getDamageableSystemsAsArray(player).filter(s => s.status.currentValue > 0);
        while(remainingEnergy > 0 && damageableSystems.length > 0 && !isPlayerDestroyed(player)) {
            const randomSystem = damageableSystems[Math.floor(Math.random() * damageableSystems.length)];
            const directDamage = remainingEnergy * phaserOnHullMultiplier;
            const appliedDamage = Math.min(randomSystem.status.currentValue, directDamage);
            applyDeltaToRangedValue(randomSystem.status, -appliedDamage);
            remainingEnergy -= appliedDamage / phaserOnHullMultiplier;
            damageableSystems = getDamageableSystemsAsArray(player).filter(s => s.status.currentValue > 0);

            const damageLogged = applyDamageEffect(state, randomSystem);
            if (!damageLogged) {
                if (randomSystem.status.currentValue <= 0) {
                    gameLog(state, GameLogLevel.Red, `${randomSystem.label} destroyed by enemy phasers`);
                } else if (randomSystem.status.fraction() < GameConstants.Rules.criticalDamageThreshold) {
                    gameLog(state, GameLogLevel.Red, `${randomSystem.label} critically damaged by enemy phasers`);
                }
                else {
                    gameLog(state, GameLogLevel.Yellow, `${randomSystem.label} sustained ${appliedDamage.toFixed(0)} damage`);
                }
            }
        }
    });
}

function applyDamageEffect(state:GameStore, {key, status}: { key: string, status: RangedValue}) {
    if (key === 'shieldGenerators') {
        if (status.fraction() < GameConstants.Rules.criticalDamageThreshold && state.gameData.player.attributes.shields.raised) {
            state.gameData.player.attributes.shields.raised = false;
            gameLog(state, GameLogLevel.Red, 'Shield generators critically damaged, shields offline');
            return true;
        }
    }
    if (key === 'sensors') {
        if (status.fraction() < GameConstants.Rules.criticalDamageThreshold) {
            gameLog(state, GameLogLevel.Red, 'Sensors critically damaged, short range scanners offline');
            return true;
        }
    }
    if (key === 'computer') {
        if (status.fraction() < GameConstants.Rules.criticalDamageThreshold) {
            const qx = state.gameData.player.position.quadrant.x;
            const qy = state.gameData.player.position.quadrant.y;
            range(0,GameConstants.Map.quadrantSize.height-1).forEach(y =>
                range(0, GameConstants.Map.quadrantSize.width-1).forEach(x => {
                    state.gameData.quadrantMapped[y][x] = x === qx && y === qy;
                })
            );
            gameLog(state, GameLogLevel.Red, 'Computer critically damaged, computer offline');
        }
    }

    return false;
}

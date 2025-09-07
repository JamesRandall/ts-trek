import type {GameStore} from "../../state/store.ts";
import {objectsInQuadrant} from "../map.ts";
import {GameObjectType} from "../../models/gameObject.ts";
import {range} from "../../utilities.ts";
import * as GameConstants from "../../gameConstants.ts";

const sensorDamageThreshold = 0.6;
const sensorDamageCriticalThreshold = 0.2;

export function applySensorDamage(state: GameStore) {
    const sensorStatus = state.gameData.player.attributes.systems.sensors.status.fraction();
    if (sensorStatus > sensorDamageThreshold) { return; }
    const gameObjects = objectsInQuadrant(state.gameData).filter(go => go.type !== GameObjectType.Player);
    const numberOfItemsImpacted =
        sensorStatus < sensorDamageCriticalThreshold ?
            gameObjects.length : Math.floor(gameObjects.length * (1-sensorStatus));
    const impactedIds = state.gameData.sensorImpactedGameObjectIds;
    const uneffectedGameObjects = gameObjects.filter(go => !impactedIds.includes(go.id));
    while(impactedIds.length < numberOfItemsImpacted && uneffectedGameObjects.length > 0) {
        const randomIndex = Math.floor(Math.random() * uneffectedGameObjects.length);
        const selectedGameObject = uneffectedGameObjects[randomIndex];

        uneffectedGameObjects.splice(randomIndex, 1);
        impactedIds.push(selectedGameObject.id);
    }
    state.gameData.sensorImpactedGameObjectIds = impactedIds;
}

export function longRangeSensorScan(state:GameStore) {
    if (state.gameData.player.attributes.systems.sensors.status.fraction() < GameConstants.Rules.criticalDamageThreshold) { return; }

    const qx = state.gameData.player.position.quadrant.x;
    const qy = state.gameData.player.position.quadrant.y;
    range(Math.max(0,qy-1), Math.min(GameConstants.Map.quadrantSize.height-1, qy+1)).forEach(y =>
        range(Math.max(qx-1,0), Math.min(GameConstants.Map.quadrantSize.width-1, qx+1)).forEach(x => {
            state.gameData.quadrantMapped[y][x] = true;
        })
    );
}
import {createCube, createScout, createWarbird} from "./Enemy.ts";
import {createPlayer, playerAttributes} from "./Player.ts";
import {uniqueRandomPositionFactory} from "./universePosition.ts";
import {range} from "../utilities.ts";
import {createStarbase} from "./Starbase.ts";
import {type GameData, GameOverState, GameState} from "./gameData.ts";
import {Star} from "./Star.ts";
import * as GameConstants from '../gameConstants.ts';

export function createNewGame() : GameData {
    const numberOfQuadrants = 8 * 8;

    const numberOfEnemies = Math.round(numberOfQuadrants * 1.5);
    const numberOfEnemyScouts = Math.round(numberOfEnemies * 0.333);
    const numberOfEnemyWarbirds = Math.round(numberOfEnemies * 0.5);
    const numberOfEnemyCubes = numberOfEnemies - numberOfEnemyScouts - numberOfEnemyWarbirds;
    const numberOfStars = numberOfQuadrants * 2;
    const numberOfStarbases = Math.round(numberOfQuadrants / 8);
    const getUniqueRandomPosition = uniqueRandomPositionFactory();
    const playerPosition = getUniqueRandomPosition();

    return {
        stardate: 2509.1,
        state: GameState.PlayerTurn,
        player: createPlayer(
            playerPosition,
            playerAttributes()
        ),
        stars: range(0, numberOfStars).map(() => new Star(getUniqueRandomPosition())),
        enemies: range(0, numberOfEnemyScouts).map(() => createScout(getUniqueRandomPosition())).concat(range(0, numberOfEnemyWarbirds).map(() => createWarbird(getUniqueRandomPosition()))).concat(range(0, numberOfEnemyCubes).map(() => createCube(getUniqueRandomPosition()))),
        starbases: range(0, numberOfStarbases).map((i) => (createStarbase(getUniqueRandomPosition(), i))),
        selectedGameObject: null,
        firingSequence: [],
        quadrantMapped:
            range(0, GameConstants.Map.quadrantSize.height-1).map(qy =>
                range(0, GameConstants.Map.quadrantSize.width-1).map(qx =>
                    qx >= playerPosition.quadrant.x -1 &&
                    qx <= playerPosition.quadrant.x + 1 &&
                    qy >= playerPosition.quadrant.y -1 &&
                    qy <= playerPosition.quadrant.y + 1
                )
            ),
        isWarping: false,
        logs: [],
        sensorImpactedGameObjectIds: [],
        gameOver: GameOverState.No
    };
}

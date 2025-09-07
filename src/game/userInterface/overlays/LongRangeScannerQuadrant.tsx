import {useGameStore} from "../../state/store.ts";
import {useMemo} from "react";
import {GameObjectType} from "../../models/gameObject.ts";
import * as GameConstants from "../../gameConstants.ts";

export function LongRangeScannerQuadrant({x, y}: { x: number, y: number}) {
    const objectsInQuadrant = useGameStore(state => state.map.objectsInQuadrant);
    const setTargetQuadrant = useGameStore(state => state.playerTurn.setTargetQuadrant);
    const discoveryMap = useGameStore(state => state.gameData.quadrantMapped);
    const player = useGameStore(state => state.gameData.player);
    const canWarpTo = useGameStore(state => state.playerTurn.canWarpTo);
    const gameObjects = objectsInQuadrant({x,y})
    const summary = useMemo(() => ({
        starbases: gameObjects.filter(o => o.type === GameObjectType.Starbase).length,
        stars: gameObjects.filter(o => o.type === GameObjectType.Star).length,
        enemies: gameObjects.filter(o => o.type === GameObjectType.Enemy).length,
        isCurrentQuadrant: player.position.quadrant.x === x && player.position.quadrant.y === y,
        isTargetQuadrant: player.attributes.targetQuadrant.x === x && player.attributes.targetQuadrant.y === y,
        isReachable: canWarpTo({x,y})
    }), [gameObjects, canWarpTo, player, x, y]);

    const pt = y === 0 ? "pt-3" : "pt-3";
    const pb = y === GameConstants.Map.quadrantSize.height-1 ? "pb-3" : "pb-3";
    const pl = x === 0 ? "pl-3" : "pl-3";
    const pr = x === GameConstants.Map.quadrantSize.width-1 ? "pr-3" : "pr-3";
    const background =
        summary.isCurrentQuadrant ? "bg-green-950" :
            (y % 2 === 0 ? x % 2 === 0 ? "bg-gray-950" : "bg-gray-925" : x % 2 === 0 ? "bg-gray-925" : "bg-gray-950");
    const horizontalBorder = `${x > 0 ? "border-l" : ""} ${x < GameConstants.Map.quadrantSize.width-1 ? "border-r" : ""}`
    const verticalBorder = `${y > 0 ? "border-t" : ""} border-b`;
    const borderEdges = `${horizontalBorder} ${verticalBorder} `;
    const border = `${borderEdges} ${summary.isTargetQuadrant ? (summary.isReachable ? "border-green-600" : "border-green-950") : "border-transparent"}`;
    const unimportantText = summary.isCurrentQuadrant ? 'text-gray-700' : 'text-gray-800';


    return (<div
        className={`cursor-pointer grid grid-cols-[repeat(3,1fr)] gap-2 ${pl} ${pr} ${pt} ${pb} font-orbitron text-gamewhite ${background} ${border}`}
        onClick={() => setTargetQuadrant({x,y})}
    >
        {
            discoveryMap[y][x] ?
                <>
                    <div className={`text-center ${summary.enemies > 0 ? 'text-red-600' : unimportantText}`}>{summary.enemies}</div>
                    <div className={`text-center ${summary.starbases > 0 ? 'text-blue-600' : unimportantText}`}>{summary.starbases}</div>
                    <div className={`text-center ${summary.stars > 0 ? 'text-orange-600' : unimportantText}`}>{summary.stars}</div>
                </>
                :
                <>
                    <div className={`text-center ${unimportantText}`}>?</div>
                    <div className={`text-center ${unimportantText}`}>?</div>
                    <div className={`text-center ${unimportantText}`}>?</div>
                </>
        }

    </div>);
}
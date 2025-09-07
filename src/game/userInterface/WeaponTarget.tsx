import {useGameStore} from "../state/store.ts";
import {type GameObject} from "../models/gameObject.ts";
import {ShortRangeScannerGameObject} from "./ShortRangeScannerGameObject.tsx";

export function WeaponTarget({targetIndex}:{targetIndex:number}) {
    const target = useGameStore(s => {
        const targetId = s.gameData.player.attributes.weapons.targetGameObjectIds[targetIndex];
        if (!targetId) return undefined;
        return s.gameData.stars.find(s => s.id === targetId) as GameObject ??
            s.gameData.enemies.find(s => s.id === targetId) as GameObject ??
            s.gameData.starbases.find(s => s.id === targetId) as GameObject;
    });
    const removeTarget = useGameStore(s => s.playerTurn.removeTarget);
    return (
        <div className="aspect-square h-full relative" onClick={() => removeTarget(targetIndex)}>
            {target ?
                <>
                    <div className="absolute inset-0 flex flex-col justify-center items-center">
                        <div className="relative" style={{width: 96, height: 96}}>
                            <ShortRangeScannerGameObject showAsTarget={true} gameObject={target} size={{width:96,height:96}} />
                        </div>
                    </div>

                    <div className="absolute top-0 left-0 w-1/5 h-1/5 border-t border-l border-gamewhite"></div>
                    <div className="absolute top-0 right-0 w-1/5 h-1/5 border-t border-r border-gamewhite"></div>
                    <div className="absolute bottom-0 left-0 w-1/5 h-1/5 border-b border-l border-gamewhite"></div>
                    <div className="absolute bottom-0 right-0 w-1/5 h-1/5 border-b border-r border-gamewhite"></div>

                    <div className="absolute top-2 left-2 text-gamewhite font-orbitron text-xs">
                        {`${target.position.sector.x},${target.position.sector.y}`}
                    </div>
                </>
                : undefined
            }
        </div>
    );
}
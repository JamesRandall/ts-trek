import {useGameStore} from "../state/store.ts";
import {WeaponTarget} from "./WeaponTarget.tsx";

export function WeaponTargets() {
    const player = useGameStore(s => s.gameData.player);

    return (
        <div className="grid grid-cols-3 gap-3 relative">
            <WeaponTarget targetIndex={0} />
            <WeaponTarget targetIndex={1} />
            <WeaponTarget targetIndex={2} />
            {player.attributes.weapons.targetGameObjectIds.length === 0 ?
                <div className="absolute inset-0 opacity-50 z-1 flex flex-col justify-center items-center">
                    No targets selected
                </div>
                :
                undefined
            }
        </div>
    )
}
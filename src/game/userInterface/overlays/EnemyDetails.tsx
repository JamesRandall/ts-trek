import {useGameStore} from "../../state/store.ts";
import type {Enemy} from "../../models/Enemy.ts";
import HorizontalGauge from "../../../components/HorizontalGauge.tsx";
import GameButton from "../../../components/GameButton.tsx";

export function EnemyDetails() {
    const sgo = useGameStore(s => s.gameData.selectedGameObject as Enemy);
    const canAddTarget = useGameStore(s => s.playerTurn.canAddTarget);
    const addTarget = useGameStore(s => s.playerTurn.addTarget);
    const removeTarget = useGameStore(s => s.playerTurn.removeTarget);
    const targetIds = useGameStore(s => s.gameData.player.attributes.weapons.targetGameObjectIds);
    const isTargetted = targetIds.includes(sgo.id);
    const sensorImpactedIds = useGameStore(state => state.gameData.sensorImpactedGameObjectIds);
    const isSensorImpacted = sensorImpactedIds.includes(sgo.id);

    // come up with a better way to sort out the width
    // tailwind-keep: bg-amber-600 text-amber-600
    return (<div className="p-3 flex flex-col gap-2 w-full font-orbitron">
        <div className="text-red-600 text-xl">{sgo.title}</div>
        <HorizontalGauge label="Hull" range={sgo.attributes.hull} showNumbers={true} isBroken={isSensorImpacted} />
        <HorizontalGauge label="Shields" range={sgo.attributes.shields} showNumbers={true} isBroken={isSensorImpacted} />
        <HorizontalGauge label="Energy" range={sgo.attributes.energy} showNumbers={true} isBroken={isSensorImpacted} />
        <div className="mt-1"/>
        { isTargetted ?
            <div className="grid grid-cols-2 gap-2">
                <GameButton title="Add target" disabled={!canAddTarget()} onClick={() => addTarget(sgo) }/>
                <GameButton title="Remove target" onClick={() => removeTarget(sgo) }/>
            </div>
            :
            <div className={ "grid grid-cols-[1fr_auto_auto] gap-2"}>
                <GameButton title="Add target" disabled={!canAddTarget()} onClick={() => addTarget(sgo) }/>
                <GameButton title="x2" disabled={!canAddTarget() || targetIds.length > 1} onClick={() => addTarget(sgo, 2) }/>
                <GameButton title="x3" disabled={!canAddTarget() || targetIds.length > 0} onClick={() => addTarget(sgo, 3) }/>
            </div>
        }
    </div>)
}
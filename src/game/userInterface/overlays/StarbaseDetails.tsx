import {useGameStore} from "../../state/store.ts";
import HorizontalGauge from "../../../components/HorizontalGauge.tsx";
import GameButton from "../../../components/GameButton.tsx";
import type {Starbase} from "../../models/Starbase.ts";
import * as GameConstants from "../../gameConstants.ts";

export function StarbaseDetails() {
    const sgo = useGameStore(s => s.gameData.selectedGameObject as Starbase);
    const isDocked = useGameStore(s => s.gameData.player.attributes.isDocked);
    const communicationStatus = useGameStore(s => s.gameData.player.attributes.systems.communications);
    const canDock = useGameStore(s => s.gameData.canDock);
    const dock = useGameStore(s => s.playerTurn.dock);
    const undock = useGameStore(s => s.playerTurn.undock);

    // come up with a better way to sort out the width
    // tailwind-keep: bg-amber-600 text-amber-600
    return (<div className="p-3 flex flex-col gap-2 w-full font-orbitron">
        <div className="text-red-600 text-xl">{sgo.name}</div>
        <HorizontalGauge label="Hull" range={sgo.attributes.hull} showNumbers={true} />
        <HorizontalGauge label="Shields" range={sgo.attributes.shields} showNumbers={true} />
        <HorizontalGauge label="Energy" range={sgo.attributes.energy} showNumbers={true} />
        <HorizontalGauge label="Torpedo stocks" range={sgo.attributes.torpedoStocks} showNumbers={true} />

        {!canDock && communicationStatus.status.fraction() >= GameConstants.Rules.criticalDamageThreshold && <div className="text-orange-600">To dock you must be adjacent to the starbase with your shields lowered</div>}
        { communicationStatus.status.fraction() <= GameConstants.Rules.criticalDamageThreshold && <div className="text-red-600">You cannot dock with critical damage to your communications</div>}
        { isDocked ?
            <GameButton title="Undock" onClick={() => undock()} />
            : <GameButton disabled={!canDock} title="Dock" onClick={() => dock()} />
        }
    </div>)
}
import {useGameStore} from "../../state/store.ts";
import HorizontalGauge from "../../../components/HorizontalGauge.tsx";
import GameButton from "../../../components/GameButton.tsx";
import type {Starbase} from "../../models/Starbase.ts";

export function StarbaseDetails() {
    const sgo = useGameStore(s => s.gameData.selectedGameObject as Starbase);
    const isDocked = useGameStore(s => s.gameData.player.attributes.isDocked);

    // come up with a better way to sort out the width
    // tailwind-keep: bg-amber-600 text-amber-600
    return (<div className="p-3 flex flex-col gap-2 w-full font-orbitron">
        <div className="text-red-600 text-xl">{sgo.name}</div>
        <HorizontalGauge label="Hull" range={sgo.attributes.hull} showNumbers={true} />
        <HorizontalGauge label="Shields" range={sgo.attributes.shields} showNumbers={true} />
        <HorizontalGauge label="Energy" range={sgo.attributes.energy} showNumbers={true} />
        <HorizontalGauge label="Torpedo stocks" range={sgo.attributes.torpedoStocks} showNumbers={true} />
        <div className="mt-1"/>
        { isDocked ?
            <GameButton title="Undock" />
            : <GameButton title="Dock" />
        }
    </div>)
}
import * as GameConstants from '../../gameConstants.ts';
import {range} from "../../utilities.ts";
import {LongRangeScannerQuadrant} from "./LongRangeScannerQuadrant.tsx";
import {useGameStore} from "../../state/store.ts";
import HorizontalGauge from "../../../components/HorizontalGauge.tsx";
import GameButton from "../../../components/GameButton.tsx";
import {useMemo} from "react";
import HorizontalSlider from "../../../components/HorizontalSlider.tsx";
import {OverlayPanel} from "../../../components/OverlayPanel.tsx";

export function LongRangeScanner() {
    const setWarpSpeed = useGameStore(s => s.playerTurn.setWarpSpeed);
    const warpTo = useGameStore(s => s.playerTurn.beginWarpTo);
    const player = useGameStore(s => s.gameData.player);
    const canWarpTo = useGameStore(state => state.playerTurn.canWarpTo);

    const isEngageDisabled = useMemo(() => {
        return !canWarpTo(player.attributes.targetQuadrant) || (
            player.attributes.targetQuadrant.x === player.position.quadrant.x &&
            player.attributes.targetQuadrant.y === player.position.quadrant.y);
    }, [canWarpTo, player])

    // tailwind-keep: border-orange-600 text-orange-600 border-green-600
    return (
        <OverlayPanel borderColor="green-600" onClick={e => e.stopPropagation()}>
            <div className="grid grid-rows-[auto_auto]">
                <div className="grid grid-cols-8">
                    {
                        range(0, GameConstants.Map.quadrantSize.height-1).flatMap(qy =>
                            range(0, GameConstants.Map.quadrantSize.width-1).map(qx =>
                                <LongRangeScannerQuadrant key={`${qx}-${qy}`} x={qx} y={qy} />
                            )
                        )
                    }
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-black text-gamewhite">
                    <HorizontalSlider
                        label="Speed"
                        range={player.attributes.warpSpeed}
                        numberFormatter={v => `${v.currentValue.toFixed(0)}`}
                        setValue={v => setWarpSpeed(v)}
                    />
                    <HorizontalGauge label="Engines" range={player.attributes.systems.warpEngines.status} />
                    <HorizontalGauge label="Deflectors" range={player.attributes.systems.deflectors.status} />
                    <HorizontalGauge label="Converter" range={player.attributes.systems.energyConverter.status} />
                    <div className="col-span-2 bg-red-300">
                        <GameButton disabled={isEngageDisabled} isBlock={true} title="Engage" color={"orange-600"} onClick={() => warpTo()} />
                    </div>
                </div>
            </div>
        </OverlayPanel>
    )
}
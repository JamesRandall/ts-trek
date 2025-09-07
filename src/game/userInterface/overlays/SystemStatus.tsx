import HorizontalGauge from "../../../components/HorizontalGauge.tsx";
import {useGameStore} from "../../state/store.ts";
import {OverlayPanel} from "../../../components/OverlayPanel.tsx";
import {getDamageableSystemsAsArray} from "../../models/Player.ts";
import {useMemo} from "react";
import GameButton from "../../../components/GameButton.tsx";

export function SystemStatus() {
    const player = useGameStore(s => s.gameData.player);
    const repair = useGameStore(s => s.playerTurn.repair);
    const toggleRepairPriority = useGameStore(s => s.playerTurn.toggleRepairPriority);
    const prioritisedRepairCosts = useGameStore(s => s.playerTurn.prioritisedRepairCosts);
    const nonPrioritisedRepairCosts = useGameStore(s => s.playerTurn.nonPrioritisedRepairCosts);
    const canRepair = useGameStore(s => s.playerTurn.canRepair);

    const renderProps = useMemo(() => {
        const timeToRepairPrioritisedSystems = prioritisedRepairCosts();
        const timeToRepairNonPrioritisedSystems = nonPrioritisedRepairCosts();
        return {
            systems: getDamageableSystemsAsArray(player),
            timeToRepairPrioritisedSystems,
            timeToRepairNonPrioritisedSystems,
            timeToRepairAllSystems: timeToRepairPrioritisedSystems + timeToRepairNonPrioritisedSystems
        };
    }, [player, prioritisedRepairCosts, nonPrioritisedRepairCosts])

    // tailwind-keep: border-green-600 border-yellow-300 text-yellow-300
    return (<OverlayPanel borderColor="green-600" width={600}>
        <div className="grid grid-cols-2 gap-3 p-3 text-gamewhite">
            {renderProps.systems.map(s =>
                <HorizontalGauge
                    key={s.label}
                    range={s.status}
                    label={s.label}
                    labelClassName={s.isRepairPrioritised ? "text-amber-600" : undefined}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleRepairPriority(s.key);
                    }}
                />
            )}
            {renderProps.timeToRepairPrioritisedSystems > 0 || renderProps.timeToRepairNonPrioritisedSystems > 0 ?
                (
                    <>
                        <div className="col-span-2">
                            { !player.attributes.isDocked &&
                                player.attributes.systems.hull.status.currentValue < player.attributes.systems.hull.status.maxValue &&
                                <div className="text-red-600 mb-1">The hull can only be repaired when docked with a starbase</div>
                            }
                            <div className="grid grid-cols-[1fr_auto] gap-y-1">
                                <div className="text-amber-600">Time to repair prioritised systems</div>
                                <div className="text-amber-600 text-right">{renderProps.timeToRepairPrioritisedSystems.toFixed(1)} days</div>
                                <div className="text-yellow-300">Time to repair non-prioritised systems</div>
                                <div className="text-yellow-300 text-right">{renderProps.timeToRepairNonPrioritisedSystems.toFixed(1)} days</div>
                            </div>
                        </div>
                        <GameButton color="amber-600" title="Repair prioritised" disabled={renderProps.timeToRepairPrioritisedSystems <= 0 || !canRepair}></GameButton>
                        <GameButton color="yellow-300" disabled={!canRepair} onClick={() => repair(renderProps.timeToRepairAllSystems)}>
                            <div className="flex flex-row justify-center items-center gap-2">
                                <div>Repair all</div>
                                <div>-</div>
                                <div>{`${(renderProps.timeToRepairPrioritisedSystems + renderProps.timeToRepairNonPrioritisedSystems).toFixed(1)} days`}</div>
                            </div>
                        </GameButton>
                    </>
                )
                : undefined
            }
        </div>
    </OverlayPanel>);
}
import {useGameStore} from "../state/store.ts";
import HorizontalGauge from "../../components/HorizontalGauge.tsx";
import GameButton from "../../components/GameButton.tsx";
import {ShieldEnergy} from "./ShieldEnergy.tsx";
import {useState} from "react";
import {PhasersPanel} from "./PhasersPanel.tsx";
import {WeaponTargets} from "./WeaponTargets.tsx";
import {TorpedoesPanel} from "./TorpedosPanel.tsx";
import {Tabs} from "../../components/Tabs.tsx";

export default function SidePanel() {
    const player = useGameStore(s => s.gameData.player);
    const playerEnergy = useGameStore(s => s.gameData.player.attributes.energy);
    const isDisabled = useGameStore(s => s.userInterface.isDisabled);
    const equalizeShieldEnergy = useGameStore(s => s.playerTurn.equalizeShieldEnergy);
    const [weaponsMode, setWeaponsMode] = useState<"phasers" | "torpedoes">("phasers");

    return (
        <div className="h-full w-full relative font-orbitron max-h-full overflow-hidden">
            <div className="absolute inset-0 z-0 bg-black opacity-70" />
            <div className="h-full grid grid-rows-[auto_1fr] border-2 border-gamewhite relative">
                <div className="p-3 flex flex-col gap-2 border-b-2 border-gamewhite pb-4">
                    <HorizontalGauge label="Hull" range={player.attributes.systems.hull.status} />
                    <HorizontalGauge label="Main Energy" range={playerEnergy} />
                    <HorizontalGauge label="Shield Generators" range={player.attributes.systems.shieldGenerators.status} />
                    <div className="grid grid-cols-[auto_1fr] gap-1 py-1">
                        <div className="grid grid-cols-[auto_auto] gap-x-2 gap-y-1 self-start">
                            <div>Fore</div>
                            <div className="text-right">{player.attributes.shields.fore.percentageString()}</div>
                            <div>Starboard</div>
                            <div className="text-right">{player.attributes.shields.starboard.percentageString()}</div>
                            <div>Aft</div>
                            <div className="text-right">{player.attributes.shields.aft.percentageString()}</div>
                            <div>Port</div>
                            <div className="text-right">{player.attributes.shields.port.percentageString()}</div>
                        </div>
                        <div className="flex flex-row justify-end items-center">
                            <div className="relative overflow-hidden h-50 w-50">
                                <ShieldEnergy />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <GameButton title="TRANSFER" disabled={isDisabled} />
                        <GameButton title="EQUALIZE" disabled={isDisabled} onClick={() => equalizeShieldEnergy()} />
                    </div>
                </div>
                <div className="flex flex-col justify-between">
                    <div className="p-3 grow grid grid-rows-[auto_1fr] gap-2 border-b-2 border-gamewhite items-end">
                        <WeaponTargets />
                        <div>{weaponsMode === 'phasers' ? <PhasersPanel /> : <TorpedoesPanel />}</div>
                    </div>
                    <Tabs
                        disabled={isDisabled}
                        tabs={[
                            {key: 'phasers', label: 'Phasers' },
                            {key: 'torpedoes', label: 'Torpedoes' }
                        ]}
                        activeTab={weaponsMode}
                        onTabChange={(key) => setWeaponsMode(key as "phasers" | "torpedoes")}
                    />
                </div>
            </div>
        </div>
    )
}
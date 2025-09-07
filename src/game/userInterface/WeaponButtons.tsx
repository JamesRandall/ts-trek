import GameButton from "../../components/GameButton.tsx";
import {useGameStore} from "../state/store.ts";

export default function WeaponButtons() {
    const firePhasers = useGameStore(s => s.playerTurn.firePhasers);
    const fireTorpedoes = useGameStore(s => s.playerTurn.fireTorpedoes);
    const isDisabled = useGameStore(s => s.userInterface.isDisabled);
    const canFirePhasers = useGameStore(s => s.playerTurn.canFirePhasers);
    const canFireTorpedoes = useGameStore(s => s.playerTurn.canFireTorpedoes);

    // tailwind-keep: text-red-500 border-red-500
    // tailwind-keep: disabled:text-red-900 disabled:border-red-900
    return <div className="grid grid-cols-2 gap-3" >
        <GameButton disabled={isDisabled || !canFirePhasers} title="FIRE PHASERS" color={"red-500"} disabledColor={"red-900"} onClick={() => firePhasers()} />
        <GameButton disabled={isDisabled || !canFireTorpedoes} title="FIRE TORPEDOES" color={"red-500"} disabledColor={"red-900"} onClick={() => fireTorpedoes()} />
    </div>
}
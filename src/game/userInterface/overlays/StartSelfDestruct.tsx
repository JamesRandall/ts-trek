import {OverlayPanel} from "../../../components/OverlayPanel.tsx";
import GameButton from "../../../components/GameButton.tsx";
import {useGameStore} from "../../state/store.ts";

export function StartSelfDestruct() {
    const hideStartSelfDestruct = useGameStore(s => s.userInterface.hideSelfDestruct);

    return (
        <OverlayPanel borderColor="red-600" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-3 font-orbitron p-3 text-center">
                <div className="text-red-600 text-4xl ">DANGER!!</div>
                <div className="text-orange-600">Activating self-destruct will result in total loss of ship and crew.</div>
                <div className="text-orange-600">Once activated you will have 5 seconds to stop the countdown.</div>
                <div className="grid grid-cols-2 gap-3">
                    <GameButton color="red-600" title="Activate self-destruct" onClick={() => {
                        hideStartSelfDestruct();
                    }} />
                    <GameButton color="green-600" title="Abort" onClick={() => {
                        hideStartSelfDestruct();
                    }} />
                </div>
            </div>
        </OverlayPanel>
    );
}
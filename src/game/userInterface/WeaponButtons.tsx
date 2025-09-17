import GameButton from "../../components/GameButton.tsx";
import {useGameStore} from "../state/store.ts";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBomb} from "@fortawesome/free-solid-svg-icons";
import {useCallback, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {StartSelfDestruct} from "./overlays/StartSelfDestruct.tsx";

export default function WeaponButtons() {
    const firePhasers = useGameStore(s => s.playerTurn.firePhasers);
    const fireTorpedoes = useGameStore(s => s.playerTurn.fireTorpedoes);
    const isDisabled = useGameStore(s => s.userInterface.isDisabled);
    const canFirePhasers = useGameStore(s => s.gameData.canFirePhasers);
    const canFireTorpedoes = useGameStore(s => s.gameData.canFireTorpedoes);
    const showSelfDestruct = useGameStore(s => s.userInterface.showStartSelfDestruct)
    const hideSelfDestruct = useGameStore(s => s.userInterface.hideStartSelfDestruct);
    const isShowingSelfDestruct = useGameStore(s => s.userInterface.isShowingStartSelfDestruct);
    const selfDestructAnchorRef = useRef<HTMLDivElement | null>(null);
    const [overlayAnchor, setOverlayAnchor] = useState<{ right: number; top:number } | null>(null);

    const handleShowSelfDestruct = useCallback(() => {
        const el = selfDestructAnchorRef.current;
        if (!el) {
            showSelfDestruct();
            return;
        }
        const rect = el.getBoundingClientRect();
        const gap = 8; // px gap above the button
        const right = rect.right + 2;
        const top = rect.top - gap; // place just above
        setOverlayAnchor({ right, top });
        showSelfDestruct();
    }, [showSelfDestruct]);

    // tailwind-keep: text-red-500 border-red-500
    // tailwind-keep: disabled:text-red-900 disabled:border-red-900
    return <>
            <div className="flex flex-row gap-3 w-full">
            <div className="grid grid-cols-2 gap-3 flex-grow" >
                <GameButton disabled={isDisabled || !canFirePhasers} title="PHASERS" color={"red-500"} disabledColor={"red-900"} onClick={() => firePhasers()} />
                <GameButton disabled={isDisabled || !canFireTorpedoes} title="TORPEDOES" color={"red-500"} disabledColor={"red-900"} onClick={() => fireTorpedoes()} />
            </div>
            <div ref={selfDestructAnchorRef} className="relative">
                <GameButton  color={"red-500"} disabled={isDisabled}  disabledColor={"red-900"} isSquare={true} onClick={() => handleShowSelfDestruct()}>
                    <FontAwesomeIcon icon={faBomb}  />
                </GameButton>
            </div>
        </div>
        {isShowingSelfDestruct && overlayAnchor && createPortal(
            <>
                <div
                    className="fixed inset-0 z-20 opacity-100 animate-in fade-in duration-300 "
                    onClick={hideSelfDestruct}
                >
                    <div className="absolute animate-in fade-in slide-in-from-top-2 duration-300" style={{
                        right: window.innerWidth - overlayAnchor.right,
                        top: overlayAnchor.top,
                        transform: "translateY(-100%)",
                    }}>
                        <StartSelfDestruct />
                    </div>
                </div>
            </>,

            document.body
        )}
    </>
}
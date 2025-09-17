import {OverlayPanel} from "../../../components/OverlayPanel.tsx";
import {useEffect, useState} from "react";
import GameButton from "../../../components/GameButton.tsx";
import {useGameStore} from "../../state/store.ts";
import {useAssets} from "../../AssetManager.tsx";

export default function SelfDestructAnimation() {
    const assetManager = useAssets();
    const [currentCounter, setCurrentCounter] = useState(5);
    const [flashColor, setFlashColor] = useState("text-red-600");
    const completeSelfDestruct = useGameStore(s => s.playerTurn.completeSelfDestruct);
    const cancelSelfDestruct = useGameStore(s => s.playerTurn.cancelSelfDestruct);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentCounter(c => {
                if (c > 0) {
                    return c - 1;
                }
                return c;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Handle flashing effect when counter reaches 0
    useEffect(() => {
        if (currentCounter === 0) {
            // Flash rapidly for 3 seconds (150ms intervals)
            const flashInterval = setInterval(() => {
                setFlashColor(prev => prev === "text-red-600" ? "text-gray-900" : "text-red-600");
            }, 150);
            
            // Stop flashing after 3 seconds
            const flashTimeout = setTimeout(() => {
                clearInterval(flashInterval);
                setFlashColor("text-red-600"); // End on red
                assetManager.assets?.sounds.bigExplosion();
                completeSelfDestruct();
            }, 3000);
            
            return () => {
                clearInterval(flashInterval);
                clearTimeout(flashTimeout);
            };
        }
    }, [completeSelfDestruct, currentCounter]);

    return <div className="absolute inset-0 z-10 flex flex-col justify-center items-center">
        <OverlayPanel borderColor="red-600">
            <div className="flex flex-col gap-10 font-orbitron p-3 text-center">
                <div className={`text-4xl ${currentCounter === 0 ? flashColor : "text-red-600"}`}>
                    {currentCounter === 0 ? "DESTRUCT!!" : "DANGER!!"}
                </div>
                <div className="grid grid-cols-5 gap-10 text-6xl px-10">
                    <div className={currentCounter === 5 ? "text-red-600" : "text-gray-900"}>5</div>
                    <div className={currentCounter === 4 ? "text-red-600" : "text-gray-900"}>4</div>
                    <div className={currentCounter === 3 ? "text-red-600" : "text-gray-900"}>3</div>
                    <div className={currentCounter === 2 ? "text-red-600" : "text-gray-900"}>2</div>
                    <div className={currentCounter === 1 ? "text-red-600" : "text-gray-900"}>1</div>
                </div>
                <GameButton disabled={currentCounter <= 0} color="green-600" title="Abort" onClick={() => cancelSelfDestruct()} />
            </div>
        </OverlayPanel>
    </div>
}
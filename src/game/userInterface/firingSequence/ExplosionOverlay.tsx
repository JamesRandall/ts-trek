import {useGameStore} from "../../state/store.ts";
import {objectWithId} from "../../actions/gameObject.ts";
import {FiringSequenceActionType} from "../../models/gameData.ts";
import {ExplosionAnimation} from "./ExplosionAnimation.tsx";
import {useAssets} from "../../AssetManager.tsx";
import {useCallback, useRef, useEffect} from "react";

export function ExplosionOverlay({cellSize} : { cellSize: { width: number, height: number} }) {
    const assetManager = useAssets();
    const nextFiringSequenceItem = useGameStore(s => s.playerTurn.nextFiringSequenceItem);
    const firingItem = useGameStore(s => s.gameData.firingSequence)[0];
    const gameData = useGameStore(s => s.gameData); // Get the whole gameData once
    const gameObjectRotations = useGameStore(s => s.userInterface.gameObjectRotations);
    const onCompleteCalledRef = useRef(false);
    const currentTargetRef = useRef<string | null>(null);

    const rotation = gameObjectRotations[firingItem?.targetId] ?? 0;
    const targetObject = firingItem ? objectWithId(gameData, firingItem.targetId) : undefined;

    // Reset the flag when we get a new target
    useEffect(() => {
        const newTargetId = firingItem?.targetId || null;
        if (currentTargetRef.current !== newTargetId) {
            currentTargetRef.current = newTargetId;
            onCompleteCalledRef.current = false;
        }
    }, [firingItem?.targetId]);

    const handleComplete = useCallback(() => {
        if (onCompleteCalledRef.current) return; // Prevent duplicate calls
        onCompleteCalledRef.current = true;
        nextFiringSequenceItem();
    }, [nextFiringSequenceItem]);

    if (!firingItem || firingItem.type !== FiringSequenceActionType.Destroyed || !targetObject) return undefined;

    return (
        <div className="absolute inset-0 z-30">
            <ExplosionAnimation
                key={`explosion-${targetObject.id}-${firingItem.targetId}`}
                image={targetObject.asset(assetManager.assets)!}
                sector={targetObject.position.sector}
                cellSize={cellSize}
                rotation={rotation}
                onStart={() => assetManager?.assets?.sounds.normalExplosion()}
                onComplete={handleComplete} />
        </div>
    );
}

import {useGameStore} from "../../state/store.ts";
import {objectWithId} from "../../actions/gameObject.ts";
import {PlayerTorpedoAnimation} from "./PlayerTorpedoAnimation.tsx";
import {FiringSequenceActionType} from "../../models/gameData.ts";
import {useEffect} from "react";
import {useAssets} from "../../AssetManager.tsx";
import {sectorDistance} from "../../actions/map.ts";

export function PlayerTorpedoOverlay({cellSize} : { cellSize: { width: number, height: number} }) {
    const assets = useAssets();
    const nextFiringSequenceItem = useGameStore(s => s.playerTurn.nextFiringSequenceItem);
    const firingSequenceLength = useGameStore(s => s.gameData.firingSequence.length);
    const firingItem = useGameStore(s => s.gameData.firingSequence)[0];
    const player = useGameStore(s => s.gameData.player);
    const targetObject = useGameStore(s => firingItem ? objectWithId(s.gameData, firingItem.targetId) : undefined)

    useEffect(() => {
        if (!firingItem || firingItem.type !== FiringSequenceActionType.Torpedoes || !targetObject) return;
        assets?.assets?.sounds.playerLaser();
    }, [assets?.assets?.sounds, firingItem, targetObject]);

    if (!firingItem || firingItem.type !== FiringSequenceActionType.Torpedoes || !targetObject) return undefined;

    const radius = cellSize.width * 0.16894531; // this is the radius of the laser saucer expressed as a percentage of the cell size
    const center = {
        x: player.position.sector.x * cellSize.width + cellSize.width / 2.0 - radius,
        y: player.position.sector.y * cellSize.height + cellSize.height * 0.35316406 }; // this is the percentage from the top to the center of the saucer
    const source = { x: center.x + radius, y: center.y };
    const target = {
        x: targetObject.position.sector.x * cellSize.width + cellSize.width / 2.0,
        y: targetObject.position.sector.y * cellSize.height + cellSize.height / 2.0
    };
    const seconds = 2.0 * sectorDistance(player.position, targetObject.position);

    // popping the key on this animation forces it to remount when the sequence is modified
    // but we also need to use the array length as part of the key because the firing sequence could contain
    // the same item multiple times
    return (
        <div className="absolute inset-0 z-30" key={`${firingItem.targetId}_${firingSequenceLength}`}>
            <PlayerTorpedoAnimation
                p1={source}
                p2={target}
                seconds={seconds}
                color="#f11"
                width={6}
                glow={12}
                intensity={0.95}
                ease
                loop={false}
                onComplete={() => {
                    nextFiringSequenceItem();
                }}
            />
        </div>
    )
}
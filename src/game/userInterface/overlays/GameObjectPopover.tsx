import {useGameStore} from "../../state/store.ts";
import {useMemo} from "react";
import {EnemyDetails} from "./EnemyDetails.tsx";
import {OverlayPanel} from "../../../components/OverlayPanel.tsx";
import {GameObjectType} from "../../models/gameObject.ts";
import {StarbaseDetails} from "./StarbaseDetails.tsx";

export function GameObjectPopover({cellSize}: { cellSize: {width: number, height: number}}) {
    const sgo = useGameStore(s => s.gameData.selectedGameObject);
    const selectGameObject = useGameStore(s => s.userInterface.selectGameObject);
    const pointingAt = useMemo(() => {
        const sx = (sgo?.position.sector.x ?? 0);
        const sy = (sgo?.position.sector.y ?? 0)
        const px = cellSize.width * sx + cellSize.width/2.0;
        const py = cellSize.height * sy + cellSize.height/2.0;

        const translateY =
            sy === 7 ? `translateY(-100%) translateY(${cellSize.height/3}px)` :
                sy === 0 ? `translateY(-50%) translateY(${cellSize.height}px)` :
            'translateY(-50%)';
        const translateX = `translateX(${cellSize.width/3}px)`;

        const transform = `${translateY} ${translateX}`

        return {x: px, y: py, transform};
    }, [cellSize, sgo?.position.sector.x, sgo?.position.sector.y])
    if (!sgo) return undefined;

    const handleBackdropClick = () => {
        selectGameObject(null);
    };

    // tailwind-keep: border-red-600 border-blue-600
    const borderColor =
        sgo.type === GameObjectType.Enemy ? 'red-600' :
            sgo.type ===  GameObjectType.Starbase ? 'blue-600' : 'gamewhite';

    return (
        <>
            <div
                className="fixed inset-0 z-50"
                onClick={handleBackdropClick}
            />
            <div className="absolute z-50" style={{ width: '420px', left: pointingAt.x, top: pointingAt.y, transform: pointingAt.transform }}>
                <OverlayPanel borderColor={borderColor}>
                    { sgo.type === GameObjectType.Enemy && <EnemyDetails/> }
                    { sgo.type === GameObjectType.Starbase && <StarbaseDetails /> }
                </OverlayPanel>
            </div>
        </>
    );
}
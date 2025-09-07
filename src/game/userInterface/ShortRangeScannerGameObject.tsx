import type {GameObject} from "../models/gameObject.ts";
import {useAssets} from "../AssetManager.tsx";
import {AiActorAction, useGameStore} from "../state/store.ts";
import {FiringSequenceActionType} from "../models/gameData.ts";
import {useEffect, useMemo, useRef, useState} from "react";
import {type Enemy, EnemyType} from "../models/Enemy.ts";
import {rotatePointsAroundCenter} from "../utilities.ts";
import {PhaserOverlay} from "./effects/PhaserOverlay.tsx";
import {CanvasSurface} from "../../components/CanvasSurface.tsx";

type Props = {
    gameObject: GameObject;
    size: { width: number; height: number };
    onPointerDown?: (e: React.PointerEvent) => void;
    isDragging?: boolean;
    dragPosition?: { x: number; y: number } | null;
    showAsTarget?: boolean;
};

const enemyRotationTimeMs = 1000;
const boardPieceImageSize = 1024;
const laserDurationInSeconds = 0.5;
const laserHoldTimeInSeconds = 0.5;

export function ShortRangeScannerGameObject({showAsTarget, gameObject, size, onPointerDown, isDragging, dragPosition}: Props) {
    const assetContext = useAssets();
    const [rotation, setRotation] = useState(0);
    //const [isRotating, setIsRotating] = useState(false);
    const [isFiring, setIsFiring] = useState(false);
    const [sourcePoints, setSourcePoints] = useState<{x:number,y:number}[]>([])
    const animationFrameRef = useRef<number>(0);
    const rotationAnimationRef = useRef<{
        startRotation: number;
        targetRotation: number;
        startTime: number;
        isActive: boolean;
    } | null>(null);

    const player = useGameStore(s => s.gameData.player);
    const firingSequenceHead = useGameStore(s => s.gameData.firingSequence[0]);
    const currentAiSequence = useGameStore(state => state.enemyTurn.aiActorSequence);
    const currentAiAction = useGameStore(state => state.enemyTurn.currentActorAction);
    const endActorTurn = useGameStore(state => state.enemyTurn.endActorTurn);
    const applyPhasersToPlayer = useGameStore(state => state.enemyTurn.applyPhasersToPlayer);
    const sensorImpactedIds = useGameStore(state => state.gameData.sensorImpactedGameObjectIds);
    const setGameObjectRotation = useGameStore(state => state.userInterface.setGameObjectRotation);

    const isImpactedBySensorMalfunction = useMemo(() => {
        return sensorImpactedIds.includes(gameObject.id);
    }, [sensorImpactedIds, gameObject.id]);

    const scannerPosition = {
        x: showAsTarget === true ? 0 : gameObject.position.sector.x * size.width,
        y: showAsTarget === true ? 0 : gameObject.position.sector.y * size.height
    }
    const playerPosition = {
        x: player.position.sector.x * size.width + size.width / 2,
        y: player.position.sector.y * size.height + size.height / 2
    }

    useEffect(() => {
        if (currentAiSequence.length === 0) return;
        if (currentAiAction?.length === 0) return;

        if (currentAiSequence[0] === gameObject.id && currentAiAction === AiActorAction.FirePhasers && !showAsTarget) {
            if ((gameObject as Enemy).enemyType !== EnemyType.Cube) {
                //setIsRotating(true);
                const goPosition = gameObject.position.sector;
                const playerPosition = player.position.sector;
                const dx = playerPosition.x - goPosition.x;
                const dy = playerPosition.y - goPosition.y;
                const angle = Math.atan2(dy, dx);
                const targetRotation = angle * (180 / Math.PI) + 90;
                setGameObjectRotation(gameObject, targetRotation);

                // Start rotation animation
                rotationAnimationRef.current = {
                    startRotation: rotation,
                    targetRotation: targetRotation,
                    startTime: performance.now(),
                    isActive: true
                };

                const animateRotation = (currentTime: number) => {
                    if (!rotationAnimationRef.current?.isActive) return;

                    const elapsed = currentTime - rotationAnimationRef.current.startTime;
                    const progress = Math.min(elapsed / enemyRotationTimeMs, 1);
                    
                    // Easing function (ease-in-out)
                    const easeInOut = progress < 0.5 
                        ? 2 * progress * progress 
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                    const currentRotation = rotationAnimationRef.current.startRotation + 
                        (rotationAnimationRef.current.targetRotation - rotationAnimationRef.current.startRotation) * easeInOut;
                    
                    setRotation(currentRotation);
                    
                    if (progress < 1) {
                        animationFrameRef.current = requestAnimationFrame(animateRotation);
                    } else {
                        //setIsRotating(false);
                        setIsFiring(true);
                        if (rotationAnimationRef.current) {
                            rotationAnimationRef.current.isActive = false;
                        }
                    }
                };

                animationFrameRef.current = requestAnimationFrame(animateRotation);
            }
            else {
                setIsFiring(true);
            }
        }

    },
        // DO NOT include rotation in this
        [currentAiSequence, currentAiAction, gameObject.id, player.position.sector, gameObject.position.sector, gameObject]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (rotationAnimationRef.current) {
                rotationAnimationRef.current.isActive = false;
            }
        };
    }, []);

    // ... existing useEffect for isFiring remains the same ...

    useEffect(() => {
        if (!isFiring) return;

        const phaserSourcePoints = (gameObject as Enemy).phaserSource;
        const rotatedPhasePoints = rotatePointsAroundCenter(phaserSourcePoints, rotation).map(p => ({
            x:(p.x / boardPieceImageSize * size.width) + scannerPosition.x,
            y:(p.y / boardPieceImageSize * size.height) + scannerPosition.y}));
        setSourcePoints(rotatedPhasePoints);
        assetContext?.assets?.sounds.enemyLaser();
        setTimeout(() => {
            applyPhasersToPlayer();
        }, laserDurationInSeconds * 1000);
        setTimeout(() => {
            setSourcePoints([]);
            setIsFiring(false);
            endActorTurn();
        }, (laserDurationInSeconds + laserHoldTimeInSeconds) * 1000);
    }, [isFiring, endActorTurn, rotation, gameObject, size.width, size.height, scannerPosition.x, scannerPosition.y, assetContext?.assets?.sounds, applyPhasersToPlayer]);

    // we don't draw the item if its being destroyed by the firing sequence
    if (firingSequenceHead?.targetId === gameObject.id && firingSequenceHead?.type === FiringSequenceActionType.Destroyed) return undefined;


    //const [hasRotated, setHasRotated] = useState(false);

    const assets  = assetContext.assets;

    const displayPosition = isDragging && dragPosition
        ? {
            x: dragPosition.x - size.width / 2,
            y: dragPosition.y - size.height / 2
        }
        : scannerPosition;

    const asset = gameObject.asset(assets);
    const renderGameObject = (ctx: CanvasRenderingContext2D, state: { width: number; height: number, timestamp: number }) => {
        if (!asset) return;

        ctx.save();

        // Clear the canvas
        ctx.clearRect(0, 0, state.width, state.height);

        const img = asset;
        if (isImpactedBySensorMalfunction) {
            // For static effect, we handle rotation differently
            drawWithStaticEffect(ctx, img, state.width, state.height, state.timestamp, rotation);
        } else {
            // Move to center of canvas for rotation
            ctx.translate(state.width / 2, state.height / 2);
            const r = (rotation * Math.PI) / 180;
            ctx.rotate(r);
            // Draw the image centered
            ctx.drawImage(img, -state.width / 2, -state.height / 2, state.width, state.height);
        }
        ctx.restore();
    };

    const drawWithStaticEffect = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number, timestamp: number, rotation: number) => {
        // Create an off-screen canvas to draw the rotated image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCanvas.width = width;
        tempCanvas.height = height;

        // Draw the rotated image to the temp canvas
        tempCtx.save();
        tempCtx.translate(width / 2, height / 2);
        const r = (rotation * Math.PI) / 180;
        tempCtx.rotate(r);
        tempCtx.drawImage(img, -width / 2, -height / 2, width, height);
        tempCtx.restore();

        // Get image data to manipulate
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Static effect parameters - use timestamp for animation
        const time = timestamp * 0.01; // Slow down the animation
        const staticIntensity = 0.3 + Math.sin(time * 0.5) * 0.2; // Varies between 0.1 and 0.5
        const lineDropoutChance = 0.1 + Math.sin(time * 0.3) * 0.05; // Chance for horizontal lines to drop out
        const offsetIntensity = 5 + Math.sin(time * 0.7) * 3; // X-axis offset strength

        // Apply effects line by line (horizontal lines stay horizontal)
        for (let y = 0; y < height; y++) {
            const shouldDropLine = Math.random() < lineDropoutChance;
            const xOffset = Math.floor((Math.random() - 0.5) * offsetIntensity * Math.sin(time + y * 0.1));

            for (let x = 0; x < width; x++) {
                const sourceX = Math.max(0, Math.min(width - 1, x - xOffset));
                const sourceIndex = (y * width + sourceX) * 4;
                const targetIndex = (y * width + x) * 4;

                if (shouldDropLine) {
                    // Drop the line (make it black or transparent)
                    data[targetIndex] = 0;     // R
                    data[targetIndex + 1] = 0; // G
                    data[targetIndex + 2] = 0; // B
                    data[targetIndex + 3] = Math.random() < 0.5 ? 0 : data[targetIndex + 3]; // A - sometimes transparent
                } else {
                    // Copy pixel with potential offset
                    data[targetIndex] = data[sourceIndex];         // R
                    data[targetIndex + 1] = data[sourceIndex + 1]; // G
                    data[targetIndex + 2] = data[sourceIndex + 2]; // B
                    data[targetIndex + 3] = data[sourceIndex + 3]; // A

                    // Add static noise
                    if (Math.random() < staticIntensity) {
                        const noise = (Math.random() - 0.5) * 100;
                        data[targetIndex] = Math.max(0, Math.min(255, data[targetIndex] + noise));
                        data[targetIndex + 1] = Math.max(0, Math.min(255, data[targetIndex + 1] + noise));
                        data[targetIndex + 2] = Math.max(0, Math.min(255, data[targetIndex + 2] + noise));
                    }
                }
            }
        }

        // Put the modified image data back and draw it (no additional rotation)
        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
    };



    return (
        <>
            <div
                style={{
                    width: size.width,
                    height: size.height,
                    userSelect: "none",
                    touchAction: "none",
                    opacity: isDragging ? 0.6 : 1,
                    cursor: isDragging ? "grabbing" : "grab",
                    top: `${displayPosition.y}px`,
                    left: `${displayPosition.x}px`,
                }}
                className="absolute"
                onPointerDown={onPointerDown}
            >
                <CanvasSurface
                    onRender={renderGameObject}
                    style={{ pointerEvents: 'none' }}
                />
            </div>

            { sourcePoints.length > 0 &&
                <div className="absolute inset-0">
                    <PhaserOverlay
                        className="z-50"
                        p1={sourcePoints}
                        p2={playerPosition}
                        seconds={laserDurationInSeconds}
                        holdTime={laserHoldTimeInSeconds}
                        color={"#3F3"}
                        loop={false} />
                </div>
            }
        </>
    )
}
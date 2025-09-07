import {CanvasSurface} from "../../components/CanvasSurface.tsx";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as GameConstants from "../gameConstants.ts";
import {useGameStore} from "../state/store.ts";
import {areInSameQuadrant, type GameObject, GameObjectType} from "../models/gameObject.ts";
import {ShortRangeScannerGameObject} from "./ShortRangeScannerGameObject.tsx";
import {useAssets} from "../AssetManager.tsx";
import {GameObjectPopover} from "./overlays/GameObjectPopover.tsx";
import {PlayerPhaserOverlay} from "./firingSequence/PlayerPhaserOverlay.tsx";
import {ExplosionOverlay} from "./firingSequence/ExplosionOverlay.tsx";
import {PlayerTorpedoOverlay} from "./firingSequence/PlayerTorpedoOverlay.tsx";

const GRID_SIZE = 8;

export function ShortRangeScanner() {
    const assetContext = useAssets();

    const divRef = useRef<HTMLDivElement>(null);
    const [cellSize, setCellSize] = useState({width:0,height:0});

    const player = useGameStore(state => state.gameData.player);
    const stars = useGameStore(state => state.gameData.stars);
    const enemies = useGameStore(state => state.gameData.enemies);
    const starbases = useGameStore(state => state.gameData.starbases);
    const selectGameObject = useGameStore(state => state.userInterface.selectGameObject);
    const selectedGameObject = useGameStore(state => state.gameData.selectedGameObject);

    const sensorsCriticallyDamaged = useMemo(() => {
        return player.attributes.systems.sensors.status.fraction() < 0.2;
    }, [player.attributes.systems.sensors.status]);

    const gameObjects: GameObject[] = useMemo(() => {
        // When sensors are critically damaged, don't display any game objects
        if (sensorsCriticallyDamaged) {
            return [];
        }
        
        const filteredStars = stars.filter(s => areInSameQuadrant(s, player));
        const filteredEnemies = enemies.filter(e => areInSameQuadrant(e, player));
        const filteredStarbases = starbases.filter(s => areInSameQuadrant(s, player));

        return [...filteredStars, ...filteredEnemies, ...filteredStarbases, player];
    }, [player, stars, enemies, starbases, sensorsCriticallyDamaged]);

    useEffect(() => {
        if (!divRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setCellSize({ width: width / GRID_SIZE, height: height / GRID_SIZE });
            }
        });

        resizeObserver.observe(divRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Drag state
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const impulseTo = useGameStore(state => state.playerTurn.impulseTo);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    const getCellFromPointer = useCallback((clientX: number, clientY: number) => {
        const el = divRef.current!;
        const r = el.getBoundingClientRect();
        const x = clientX - r.left;
        const y = clientY - r.top;
        const col = clamp(Math.floor(x / cellSize.width), 0, GRID_SIZE - 1);
        const row = clamp(Math.floor(y / cellSize.height), 0, GRID_SIZE - 1);
        return { col, row };
    }, [cellSize.width, cellSize.height]);

    const getPositionFromPointer = useCallback((clientX: number, clientY: number) => {
        const el = divRef.current!;
        const r = el.getBoundingClientRect();
        const x = clientX - r.left;
        const y = clientY - r.top;
        return { x, y };
    }, []);

    // Start dragging when a piece is pressed
    const handlePickUp = useCallback((id: string, e: React.PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

        // Find the game object being dragged
        const gameObject = gameObjects.find(go => go.id === id);
        if (gameObject) {
            // Calculate the offset between the pointer and the object's center
            const pointerPos = getPositionFromPointer(e.clientX, e.clientY);
            const objectCenterX = gameObject.position.sector.x * cellSize.width + cellSize.width / 2;
            const objectCenterY = gameObject.position.sector.y * cellSize.height + cellSize.height / 2;

            setDragOffset({
                x: pointerPos.x - objectCenterX,
                y: pointerPos.y - objectCenterY
            });

            setDragPosition({
                x: pointerPos.x - dragOffset.x,
                y: pointerPos.y - dragOffset.y
            });
        }

        setDraggingId(id);
        setHoverCell(getCellFromPointer(e.clientX, e.clientY));
    }, [getCellFromPointer, getPositionFromPointer, gameObjects, cellSize.width, cellSize.height, dragOffset.x, dragOffset.y]);

    // While dragging, update hovered cell
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!draggingId) return;

        const pointerPos = getPositionFromPointer(e.clientX, e.clientY);
        setDragPosition({
            x: pointerPos.x - dragOffset.x,
            y: pointerPos.y - dragOffset.y
        });

        setHoverCell(getCellFromPointer(e.clientX, e.clientY));
    }, [draggingId, getCellFromPointer, getPositionFromPointer, dragOffset.x, dragOffset.y]);

    // Drop: snap to grid + commit to store
    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!draggingId) return;
        const cell = getCellFromPointer(e.clientX, e.clientY);

        // If pieces can be >1x1, validate/clamp here before committing.
        // Example: clamp to keep bottom/right edges inside the board.

        impulseTo(cell.col,cell.row);
        setDraggingId(null);
        setHoverCell(null);
        setDragPosition(null);
        setDragOffset({ x: 0, y: 0 });
    }, [draggingId, getCellFromPointer, impulseTo]);

    const objectPointerDown = (go:GameObject, e:React.PointerEvent) => {
        if (go.type === GameObjectType.Player) {
            handlePickUp(go.id, e);
        }
        else {
            selectGameObject(go);
        }
    }

    const drawScannerWithStaticEffect = useCallback((ctx: CanvasRenderingContext2D, state: { width: number; height: number, timestamp: number }) => {
        ctx.save();
        ctx.clearRect(0, 0, state.width, state.height);

        if (sensorsCriticallyDamaged) {
            const time = state.timestamp * 0.01;
            
            // Get the actual canvas backing store dimensions
            const canvas = ctx.canvas;
            const backingWidth = canvas.width;
            const backingHeight = canvas.height;
            
            // Create image data for the full backing store size
            const imageData = ctx.createImageData(backingWidth, backingHeight);
            const data = imageData.data;
            
            // Fill with pure random black/white pixels for crackly effect
            for (let i = 0; i < data.length; i += 4) {
                const pixelIndex = i / 4;
                const noise = Math.random();
                const timeNoise = Math.sin(time + pixelIndex * 0.001) * 0.5 + 0.5;
                const combinedNoise = (noise + timeNoise) / 2;
                
                if (combinedNoise > 0.85) { // Only show static on ~15% of pixels
                    const isWhite = Math.random() > 0.3; // 70% white, 30% black for contrast
                    const value = isWhite ? 255 : 0;
                    
                    data[i] = value;     // R
                    data[i + 1] = value; // G  
                    data[i + 2] = value; // B
                    data[i + 3] = 200;   // A - slightly transparent so grid shows through
                } else {
                    // Transparent pixel - let background show through
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                    data[i + 3] = 0;
                }
            }
            
            // Add some horizontal scan line interference
            for (let y = 0; y < backingHeight; y += 1) {
                const scanNoise = Math.sin(time * 5 + y * 0.1) * 0.5 + 0.5;
                if (scanNoise > 0.95) {
                    // Darken or brighten entire scan lines occasionally
                    const isDark = Math.random() > 0.5;
                    for (let x = 0; x < backingWidth; x++) {
                        const index = (y * backingWidth + x) * 4;
                        if (index < data.length - 3) {
                            const value = isDark ? 0 : 255;
                            data[index] = value;
                            data[index + 1] = value;
                            data[index + 2] = value;
                            data[index + 3] = 100; // More transparent scan lines
                        }
                    }
                }
            }
            
            // Put the image data at the origin (0,0) to fill the entire canvas
            ctx.putImageData(imageData, 0, 0);
        }

        // Now draw the normal grid
        ctx.strokeStyle = GameConstants.Colors.gameWhite;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, state.width-2, state.height-2);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        for (let index = 1; index < 8; index++) {
            ctx.moveTo(index * cellSize.width, 0);
            ctx.lineTo(index * cellSize.width, state.height);
            ctx.moveTo(0, index * cellSize.height);
            ctx.lineTo(state.width, index * cellSize.height);
        }
        ctx.stroke();

        ctx.restore();
    }, [cellSize.width, cellSize.height, sensorsCriticallyDamaged]);

    // I'd originally started off with a square aspect and dynamic sizing but there's an awful lot going
    // on now and as the top level size is basically fixed with transform type scaling its more robust just
    // to width / height this here. Might come back at some point and adopt a responsive styling approach so
    // it works on phone...
    return (
        <div className={"relative " + (assetContext.isLoading ? "opacity-0" : "")}
             ref={divRef}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
             onPointerCancel={handlePointerUp}
             onPointerLeave={handlePointerUp}
             style={{
                 width: 771,
                 height: 771
             }}
        >
            <div className="absolute inset-0 z-0 bg-black opacity-70" />
            <div className="absolute inset-0 z-10">
                <CanvasSurface
                    context="2d"
                    onRender={sensorsCriticallyDamaged ? drawScannerWithStaticEffect : (ctx, sz) => {
                        const g = ctx as CanvasRenderingContext2D;
                        g.save();
                        g.clearRect(0, 0, sz.width, sz.height);
                        g.strokeStyle = GameConstants.Colors.gameWhite;
                        g.lineWidth = 2;
                        g.strokeRect(1, 1, sz.width-2, sz.height-2);
                        g.lineWidth = 0.5;
                        g.beginPath();
                        g.setLineDash([4, 4]);
                        for (let index = 1; index < 8; index++) {
                            g.moveTo(index * cellSize.width, 0);
                            g.lineTo(index * cellSize.width, sz.height);
                            g.moveTo(0, index * cellSize.height);
                            g.lineTo(sz.width, index * cellSize.height);
                        }
                        g.stroke();

                        g.restore();
                    }}
                />
            </div>

            {hoverCell && !sensorsCriticallyDamaged && (
                <div
                    className="absolute z-20 pointer-events-none bg-gray-800"
                    style={{
                        left: hoverCell.col * cellSize.width + 1,
                        top: hoverCell.row * cellSize.height + 1,
                        width: cellSize.width - 2,
                        height: cellSize.height - 2,
                    }}
                />
            )}

            <div className="absolute inset-0 z-20">
                {gameObjects.map((go) =>
                    <ShortRangeScannerGameObject
                        gameObject={go}
                        size={cellSize}
                        key={go.id}
                        isDragging={draggingId === go.id}
                        dragPosition={draggingId === go.id ? dragPosition : null}
                        onPointerDown={(e) => objectPointerDown(go, e) }
                    />
                )}
            </div>

            {selectedGameObject !== null && !sensorsCriticallyDamaged && (
                <GameObjectPopover cellSize={cellSize} />
            )}

            {!sensorsCriticallyDamaged && <PlayerPhaserOverlay cellSize={cellSize} />}
            {!sensorsCriticallyDamaged && <PlayerTorpedoOverlay cellSize={cellSize} />}
            {!sensorsCriticallyDamaged && <ExplosionOverlay cellSize={cellSize} />}

        </div>
    );
}
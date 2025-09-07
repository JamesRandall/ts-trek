import {CanvasSurface} from "../../components/CanvasSurface.tsx";
import * as GameConstants from "../gameConstants.ts";
import {useGameStore} from "../state/store.ts";
import {useAssets} from "../AssetManager.tsx";
import React, {useEffect, useRef} from "react";

// Remove the setupHiDpi function - CanvasSurface handles this
// function setupHiDpi(ctx: CanvasRenderingContext2D) { ... }

const deg = (d: number) => (d * Math.PI) / 180;
const degFromTop = (d: number) => ((d-90) * Math.PI) / 180;

type ArcOptions = {
    color?: string;          // stroke color
    thickness?: number;      // line width in px
    cap?: CanvasLineCap;     // "butt" -> flat ends (default), "square", "round"
    anticlockwise?: boolean; // default: false
};

function drawArc(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,          // centerline radius
    startAngle: number,      // radians
    endAngle: number,        // radians
    opts: ArcOptions = {}
) {
    const {
        color = "#00ff9f",
        thickness = 6,
        cap = "butt",              // flat/square edges
        anticlockwise = false,
    } = opts;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = cap;           // "butt" gives the square/flat ends
    ctx.lineJoin = "miter";

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
    ctx.stroke();
    ctx.restore();
}

export function ShieldEnergy() {
    const shieldEnergies = useGameStore(state => state.gameData.player.attributes.shields);
    const toggleShields = useGameStore(state => state.playerTurn.toggleShieldStatus);
    const isDisabled = useGameStore(state => state.userInterface.isDisabled);
    const transferFore = useGameStore(state => state.playerTurn.transferEnergyToForeShield);
    const transferStarboard = useGameStore(state => state.playerTurn.transferEnergyToStarboardShield);
    const transferAft = useGameStore(state => state.playerTurn.transferEnergyToAftShield);
    const transferPort = useGameStore(state => state.playerTurn.transferEnergyToPortShield);
    const isInitialRender = useRef(true);

    const assets = useAssets();

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        if (shieldEnergies.raised) {
            assets.assets?.sounds.shieldsRaised();
        } else {
            assets.assets?.sounds.shieldsLowered();
        }
    }, [shieldEnergies.raised]);

    const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
        if (isDisabled) return;

        // Find the canvas to base geometry on
        const container = e.currentTarget;
        const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
        const rect = (canvas ?? container).getBoundingClientRect();

        const w = rect.width;
        const h = rect.height;

        // Recreate drawing geometry in CSS pixels
        const thickness = 8;
        const cy = h / 2;
        let cx = w / 2;
        if (cx > cy) {
            // Keep the same horizontal shift as in drawing code when non-square
            cx = w - cy;
        }
        const outerBarRadius = Math.min(cx, cy) - thickness / 2;
        const radiusDelta = thickness * 2;

        // Click position relative to container top-left in CSS pixels
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        const dx = px - cx;
        const dy = py - cy;
        const r = Math.hypot(dx, dy);


        // 2) Quadrant clicks: accept clicks within the 4-ring band
        //    Band spans from inner edge of innermost ring to outer edge of outermost ring.
        const ringMin = outerBarRadius - radiusDelta * 3 - thickness; // inner edge
        const ringMax = outerBarRadius + thickness;                    // outer edge

        if (r <= ringMin) {
            toggleShields();
            return;
        }

        if (r > ringMax) {
            // Outside interactive ring area; ignore
            return;
        }

        // Determine quadrant by angle (0 deg at +X, CCW; up is -90 deg)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Map to quadrants:
        // -45..45   => Starboard (right)
        // 45..135   => Aft (down)
        // -135..-45 => Fore (up)
        // else      => Port (left)
        if (angle >= -45 && angle <= 45) {
            transferStarboard();
        } else if (angle > 45 && angle < 135) {
            transferAft();
        } else if (angle >= -135 && angle < -45) {
            transferFore();
        } else {
            transferPort();
        }
    };


    return (<div className="w-full h-full relative" onPointerDown={handlePointerDown}>
        <CanvasSurface onRender={(ctx, state) => {
            ctx.save();
            // Remove setupHiDpi call - CanvasSurface handles DPR scaling

            ctx.clearRect(0, 0, state.width, state.height);
            let cx = state.width / 2;
            const cy = state.height / 2;
            const thickness = 8;

            const outerBarRadius = Math.min(cx,cy) - thickness/2;
            const radiusDelta = thickness * 2;
            if (cx > cy) { cx = state.width - cy; }

            const ranges = [
                shieldEnergies.fore,
                shieldEnergies.starboard,
                shieldEnergies.aft,
                shieldEnergies.port,
            ]
            const startingAngle = degFromTop(-44);
            const gap = deg(1);
            const arcLength = deg(89);
            const barStyle = {
                color: GameConstants.Colors.gameWhite,
                thickness,
                cap: "butt" as CanvasLineCap, // flat ends
            };
            const shieldsRaised = shieldEnergies.raised;
            
            // Safari-compatible brightness control - use globalAlpha instead of filter
            const brightness = shieldsRaised ? 1.0 : 0.4;

            const white = GameConstants.Colors.gameWhite;
            const warning = GameConstants.Colors.gaugeWarning;
            const critical = GameConstants.Colors.gaugeCritical;

            ranges.forEach((range, index) => {
                const startAngle = startingAngle + (arcLength + gap) * index;
                const endAngle = startAngle + arcLength - gap;
                
                ctx.globalAlpha = brightness;
                
                drawArc(ctx, cx, cy, outerBarRadius, startAngle, endAngle, {
                    ...barStyle,
                    color: range.percentage() >= 75 ? white : GameConstants.Colors.gaugeBackground
                })
                drawArc(ctx, cx, cy, outerBarRadius - radiusDelta, startAngle, endAngle, {
                    ...barStyle,
                    color: range.percentage() >= 50 ? white : GameConstants.Colors.gaugeBackground
                })
                drawArc(ctx, cx, cy, outerBarRadius - radiusDelta*2, startAngle, endAngle, {
                    ...barStyle,
                    color: range.percentage() >= 25 ? (range.percentage() < 50 ? warning : white) : GameConstants.Colors.gaugeBackground
                })
                drawArc(ctx, cx, cy, outerBarRadius - radiusDelta*3, startAngle, endAngle, {
                    ...barStyle,
                    color: range.percentage() > 0 ? (range.percentage() < 25 ? critical : (range.percentage() < 50 ? warning : white)) : GameConstants.Colors.gaugeBackground
                })
            })

            const maxImageSize = outerBarRadius - radiusDelta * 2;

            if (assets.assets?.player !== null && !assets.isLoading) {
                ctx.globalAlpha = 1.0; // Reset alpha for the ship image
                ctx.drawImage(assets.assets!.player!, cx - maxImageSize / 2, cy - maxImageSize / 2, maxImageSize, maxImageSize);
            }
            
            ctx.restore();
        }}/>
    </div>);
}
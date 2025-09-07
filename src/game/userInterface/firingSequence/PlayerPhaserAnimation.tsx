import {useCallback, useRef} from 'react';
import { CanvasSurface, type CanvasState } from '../../../components/CanvasSurface.tsx';
import {drawGlint, drawLaser, drawLaserPath} from './laser.ts';
import { beamSegmentAtTime, easeInOut, type Vec2 } from './beamAnimation.ts';


export type LaserLayerProps = {
    p1: Vec2;                 // circle centre
    p2: Vec2;                 // beam target
    seconds: number;          // beam grow + beam retract time (each)
    arcRadius: number;        // circle radius
    arcSeconds: number;       // split-arc build duration (Phase 0)
    arcRetractSeconds?: number; // split-arc retract duration (Phase 2)
    color?: string;
    width?: number;
    glow?: number;
    intensity?: number;
    ease?: boolean;
    loop?: boolean;
    onComplete?: () => void;
};

export function PlayerPhaserAnimation({
                               p1, p2, seconds, arcRadius, arcSeconds,
                               arcRetractSeconds = Math.max(0.2, seconds * 0.5),
                               color = '#6cf',
                               width = 2,
                               glow = 6,
                               intensity = 0.95,
                               ease = true,
                               loop = true,
                               onComplete,
                           }: LaserLayerProps) {
    const completedRef = useRef(false);

    const onRender = useCallback((ctx: CanvasRenderingContext2D, state: CanvasState) => {
        const { width: W, height: H, dpr, elapsed } = state;

        // BG
        ctx.clearRect(0, 0, W, H);

        const E = ease ? easeInOut : (x: number) => x;

        // Durations
        const durArc        = Math.max(0.0001, arcSeconds);         // Phase 0
        const durGrow       = Math.max(0.0001, seconds);            // Phase 1
        const durArcRetract = Math.max(0.0001, arcRetractSeconds);  // Phase 2
        const durRetract    = Math.max(0.0001, seconds);            // Phase 3

        const tSec = elapsed / 1000;
        const cycle = durArc + durGrow + durArcRetract + durRetract;
        const tt = loop ? (tSec % cycle) : Math.min(tSec, cycle);

        if (!loop && tSec >= cycle && !completedRef.current && onComplete) {
            completedRef.current = true;
            onComplete();
        }

        if (completedRef.current) {
            ctx.clearRect(0, 0, W, H);
            return;
        }


        // Geometry
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const exitPoint = { x: p1.x + ux * arcRadius, y: p1.y + uy * arcRadius };

        const thetaExit = Math.atan2(uy, ux);
        const thetaOpp  = thetaExit + Math.PI;

        const glintMs = 180;                             // how long the glint lasts

        // Polyline arc builder (robust vs arc() direction quirks)
        const buildArcPolyline = (c: CanvasRenderingContext2D, cx: number, cy: number, r: number, a0: number, a1: number, steps = 48) => {
            const sweep = a1 - a0;
            const n = Math.max(2, Math.round(steps * Math.abs(sweep) / Math.PI));
            for (let i = 0; i <= n; i++) {
                const t = i / n;
                const a = a0 + sweep * t;
                const x = cx + r * Math.cos(a);
                const y = cy + r * Math.sin(a);
                if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
            }
        };

        // Split-arc drawing helpers
        const drawSplitArcBuild = (sweep: number) => {
            // CCW side: thetaOpp -> thetaOpp + sweep
            drawLaserPath(ctx, (c) => { buildArcPolyline(c, p1.x, p1.y, arcRadius, thetaOpp, thetaOpp + sweep); },
                { color, width, glow, intensity, dpr, solidCore: true });
            // CW side: thetaOpp -> thetaOpp - sweep
            drawLaserPath(ctx, (c) => { buildArcPolyline(c, p1.x, p1.y, arcRadius, thetaOpp, thetaOpp - sweep); },
                { color, width, glow, intensity, dpr, solidCore: true });
        };

        // Retract from the BACK (opposite) toward the EXIT:
        // keep only the segments NEAR the exit on both sides.
        const drawSplitArcRemaining = (remaining01: number) => {
            const remain = Math.max(0, Math.min(1, remaining01));
            const sweepRemain = Math.PI * remain; // 0..π

            if (sweepRemain <= 0.0001) return;

            // Near-exit CCW side: [thetaExit - sweepRemain, thetaExit]
            drawLaserPath(ctx, (c) => { buildArcPolyline(c, p1.x, p1.y, arcRadius, thetaExit - sweepRemain, thetaExit); },
                { color, width, glow, intensity, dpr, solidCore: true });

            // Near-exit CW side: [thetaExit, thetaExit + sweepRemain]
            drawLaserPath(ctx, (c) => { buildArcPolyline(c, p1.x, p1.y, arcRadius, thetaExit, thetaExit + sweepRemain); },
                { color, width, glow, intensity, dpr, solidCore: true });
        };

        // ----- Phase 0: split-arc build
        if (tt < durArc) {
            const u = E(tt / durArc);
            drawSplitArcBuild(Math.PI * u);

            // GLINT: pre-fire micro pop (very subtle; optional)
            // const pre = Math.max(0, 1 - (durArc - tt) / 60); // tiny lead-in if you want
            // drawGlint(ctx, exitPoint.x, exitPoint.y, ux, uy, width*3, 0.2*pre, dpr);
            return;
        }

        const t1 = tt - durArc;

// ----- Phase 1: beam grow (arc fully drawn)
        if (t1 < durGrow) {
            drawSplitArcBuild(Math.PI);

            // GLINT: bright at arc completion, fading out over glintMs
            const msSinceArc = t1 * 1000;
            if (msSinceArc <= glintMs) {
                const fade = 1 - (msSinceArc / glintMs);    // linear fade; swap for E() if you want ease
                drawGlint(ctx, exitPoint.x, exitPoint.y, ux, uy, width * 4, fade, dpr);
            }

            const u = E(t1 / durGrow);
            const [a, b] = beamSegmentAtTime(exitPoint, p2, u * durGrow, durGrow, E);
            drawLaser(ctx, a.x, a.y, b.x, b.y, { color, width, glow, intensity, dpr });
            return;
        }

        const t2 = t1 - durGrow;

        // ----- Phase 2: arc retract FROM BACK → EXIT (beam held fully extended)
        if (t2 < durArcRetract) {
            // optional second sparkle for 90ms
            if (t2 * 1000 <= 90) {
                const fade = 1 - (t2 * 1000 / 90);
                drawGlint(ctx, exitPoint.x, exitPoint.y, ux, uy, width * 3.5, 0.6 * fade, dpr);
            }

            const v = E(t2 / durArcRetract);          // 0..1
            drawSplitArcRemaining(1 - v);             // shrink near the opposite, leave near-exit segments
            drawLaser(ctx, exitPoint.x, exitPoint.y, p2.x, p2.y, { color, width, glow, intensity, dpr });
            return;
        }

        const t3 = t2 - durArcRetract;

        // ----- Phase 3: beam retract (arc gone)
        {
            const w = E(Math.min(1, t3 / durRetract));
            const [a, b] = beamSegmentAtTime(exitPoint, p2, durGrow + w * durRetract, durGrow, E);
            drawLaser(ctx, a.x, a.y, b.x, b.y, { color, width, glow, intensity, dpr });
        }

    }, [
        p1, p2,
        seconds, arcRadius, arcSeconds, arcRetractSeconds,
        color, width, glow, intensity,
        ease, loop, onComplete,
    ]);

    return <CanvasSurface onRender={onRender} />;
}

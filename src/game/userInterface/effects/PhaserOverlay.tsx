// LaserLayer.tsx
import React, { useCallback } from 'react';
import { CanvasSurface, type CanvasState } from '../../../components/CanvasSurface.tsx';
import { drawLaser } from '../firingSequence/laser.ts';
import { easeInOut, type Vec2 } from '../firingSequence/beamAnimation.ts';

export type LaserLayerProps = {
    p1: Vec2[];
    p2: Vec2;
    seconds: number;          // n seconds for grow, then n for hold, then n for retract
    holdTime?: number;        // additional time to hold the full beam (defaults to seconds/2)
    color?: string;
    width?: number;
    glow?: number;
    intensity?: number;
    background?: string | null; // e.g. '#000' to paint each frame, null to leave existing pixels
    ease?: boolean;             // ease in/out the motion
    loop?: boolean;             // true = keep looping; false = stop after full cycle
    className?: string;
    style?: React.CSSProperties;
};

export function PhaserOverlay({
                                  p1,
                                  p2,
                                  seconds,
                                  holdTime = seconds / 2,
                                  color = '#6cf',
                                  width = 2,
                                  glow = 4,
                                  intensity = 0.95,
                                  ease = true,
                                  loop = true,
                                  className,
                                  style
                              }: LaserLayerProps) {

    const onRender = useCallback((ctx: CanvasRenderingContext2D, state: CanvasState) => {
        const { width: W, height: H, dpr, elapsed } = state;

        ctx.clearRect(0, 0, W, H);

        const tSeconds = elapsed / 1000;
        const fullCycle = 2 * seconds + holdTime;

        // If not looping and past one full cycle, don't render anything
        if (!loop && tSeconds >= fullCycle) {
            return;
        }

        // Clamp time to one cycle if not looping
        const effectiveTime = loop ? tSeconds : Math.min(tSeconds, fullCycle);

        // Draw a laser from each point in p1 to p2
        p1.forEach(startPoint => {
            const [a, b] = beamSegmentAtTimeWithHold(startPoint, p2, effectiveTime, seconds, holdTime, ease ? easeInOut : undefined);

            drawLaser(ctx, a.x, a.y, b.x, b.y, {
                color, width, glow, intensity, dpr
            });
        });
    }, [p1, p2, seconds, holdTime, color, width, glow, intensity, ease, loop]);

    return (
        <CanvasSurface
            className={className}
            style={style}
            onRender={onRender}
            // Optional: init hook to set compositing defaults or prewarm
            onInit={(ctx) => {
                // Nothing required; kept for extensibility
                void ctx;
            }}
            // Optional: respond to resizes (not required for this effect)
            onResize={() => {}}
            // Optional: cleanup (not required)
            onDispose={() => {}}
        />
    );
}

/**
 * Enhanced beam animation with hold phase
 * Phase 1: 0..durationSeconds -> head moves 0..1, tail at p1
 * Phase 2: durationSeconds..durationSeconds+holdTime -> full beam held
 * Phase 3: durationSeconds+holdTime..2*durationSeconds+holdTime -> tail moves 0..1, head at p2
 */
function beamSegmentAtTimeWithHold(
    p1: Vec2,
    p2: Vec2,
    nowSeconds: number,
    durationSeconds: number,
    holdTime: number,
    easing?: (t: number) => number
): [Vec2, Vec2] {
    const cycle = 2 * Math.max(0.0001, durationSeconds) + holdTime;
    const t = nowSeconds % cycle;

    if (t <= durationSeconds) {
        // Phase 1: Growing
        const uRaw = t / durationSeconds;               // 0..1
        const u = easing ? easing(uRaw) : uRaw;
        return [p1, mix(p1, p2, u)];
    } else if (t <= durationSeconds + holdTime) {
        // Phase 2: Holding full beam
        return [p1, p2];
    } else {
        // Phase 3: Retracting
        const vRaw = (t - durationSeconds - holdTime) / durationSeconds; // 0..1
        const v = easing ? easing(vRaw) : vRaw;
        return [mix(p1, p2, v), p2];
    }
}

// Helper function for mixing two points
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (p: Vec2, q: Vec2, t: number): Vec2 => ({ x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) });
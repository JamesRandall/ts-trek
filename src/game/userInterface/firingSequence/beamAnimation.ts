// beamAnim.ts
export type Vec2 = { x: number; y: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (p: Vec2, q: Vec2, t: number): Vec2 => ({ x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) });

// Smoothstep-ish easing (optional)
export const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
export const easeIn = (t: number) => 1 - Math.cos((Math.PI * t) / 2);

/**
 * For time (seconds) returns [A, B] segment of the beam between p1 and p2.
 * Phase 1: 0..duration -> head moves 0..1, tail at p1
 * Phase 2: duration..2*duration -> tail moves 0..1, head at p2
 * Loops every 2*duration unless caller stops.
 */
export function beamSegmentAtTime(
    p1: Vec2,
    p2: Vec2,
    nowSeconds: number,
    durationSeconds: number,
    easing?: (t: number) => number
): [Vec2, Vec2] {
    const cycle = 2 * Math.max(0.0001, durationSeconds);
    const t = nowSeconds % cycle;

    if (t <= durationSeconds) {
        const uRaw = t / durationSeconds;               // 0..1
        const u = easing ? easing(uRaw) : uRaw;
        return [p1, mix(p1, p2, u)];
    } else {
        const vRaw = (t - durationSeconds) / durationSeconds; // 0..1
        const v = easing ? easing(vRaw) : vRaw;
        return [mix(p1, p2, v), p2];
    }
}

export const angleOf = (c: Vec2, p: Vec2) => Math.atan2(p.y - c.y, p.x - c.x);
export const projectToCircle = (c: Vec2, r: number, p: Vec2): Vec2 => {
    const dx = p.x - c.x, dy = p.y - c.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: c.x + (dx / len) * r, y: c.y + (dy / len) * r };
};

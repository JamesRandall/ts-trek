import { CanvasSurface } from "../../../components/CanvasSurface.tsx";
import React from "react";

type RNG = { next(): number }; // [0,1)
class LCG implements RNG {
    private state: bigint;
    constructor(seed: bigint) {
        const A = 6364136223846793005n;
        this.state = (seed * A + 1n) & ((1n << 64n) - 1n);
    }
    private next64(): bigint {
        const A = 6364136223846793005n;
        this.state = (this.state * A + 1n) & ((1n << 64n) - 1n);
        return this.state;
    }
    next(): number {
        const top53 = Number(this.next64() >> 11n);
        return top53 / 2 ** 53;
    }
}

function wrapMod(x: number, m: number): number {
    // Always returns [0, m)
    return ((x % m) + m) % m;
}

type Star = {
    // initial x in pixels (including margin band), fixed y in pixels
    x0: number;
    y: number;
    depth: number;   // 0 = far, 1 = near
    jitter: number;  // small per-star speed variance
    twinkle: number; // per-star phase
};

function makeStars(count: number, seed: bigint, w: number, h: number): Star[] {
    const rng = new LCG(seed);
    const margin = 12; // draw a little offscreen to avoid popping
    const spanW = w + 2 * margin;

    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
        const y = rng.next() * h;
        const x0 = rng.next() * spanW - margin; // [-margin, w+margin)
        const depth = rng.next() ** 1.5; // bias toward far stars
        const jitter = (rng.next() - 0.5) * 0.2; // +/-10%
        const twinkle = rng.next() * Math.PI * 2;
        stars.push({ x0, y, depth, jitter, twinkle });
    }
    return stars;
}

export function ParallaxStarfield({
                                      starCount = 900,
                                      // "speed" is expressed in screens per second for a mid-depth star
                                      speed = 0.35,
                                      streakSeconds = 0.05,
                                      seed = 42n,
                                  }: {
    starCount?: number;
    speed?: number;        // screens/sec at depth≈0.5
    streakSeconds?: number;
    seed?: bigint;
}) {
    const starsRef = React.useRef<Star[] | null>(null);
    const lastSizeRef = React.useRef<{ w: number; h: number } | null>(null);

    return (
        <div className="w-full h-full bg-black">
            <CanvasSurface
                context="2d"
                onInit={(ctx, s) => {
                    const g = ctx as CanvasRenderingContext2D;
                    g.imageSmoothingEnabled = false;
                    g.globalCompositeOperation = "source-over";
                    g.lineCap = "round";
                    starsRef.current = makeStars(Math.max(1, starCount), seed, s.width, s.height);
                    lastSizeRef.current = { w: s.width, h: s.height };
                }}
                onResize={(ctx, s) => {
                    const g = ctx as CanvasRenderingContext2D;
                    g.fillStyle = "black";
                    g.fillRect(0, 0, s.width, s.height);
                    // Rebuild stars with new canvas size to keep density consistent
                    starsRef.current = makeStars(Math.max(1, starCount), seed, s.width, s.height);
                    lastSizeRef.current = { w: s.width, h: s.height };
                }}
                onRender={(ctx, s) => {
                    const g = ctx as CanvasRenderingContext2D;
                    const w = s.width, h = s.height;
                    const margin = 12;
                    const spanW = w + 2 * margin;

                    let stars = starsRef.current;
                    // Safety: if size changed without onResize (rare), rebuild
                    if (!stars || !lastSizeRef.current || lastSizeRef.current.w !== w || lastSizeRef.current.h !== h) {
                        stars = starsRef.current = makeStars(Math.max(1, starCount), seed, w, h);
                        lastSizeRef.current = { w, h };
                    }

                    // Opaque clear
                    g.fillStyle = "black";
                    g.fillRect(0, 0, w, h);

                    const t = s.elapsed / 1000; // seconds
                    const dt = Math.max(0, streakSeconds);

                    for (const st of stars!) {
                        // Parallax velocity in pixels/sec:
                        // Far stars (depth ~ 0) move slowly; near stars (depth ~ 1) move faster.
                        const depthSpeedFactor = 0.25 + 1.75 * st.depth; // [0.25, 2.0]
                        const velocity = (speed * depthSpeedFactor * (1 + st.jitter)) * w; // px/sec

                        // Current & previous x positions with seamless wrap in [-margin, w+margin)
                        const xNowWrapped = wrapMod(st.x0 - t * velocity + margin, spanW) - margin;
                        const xPrevWrapped = wrapMod(st.x0 - Math.max(0, t - dt) * velocity + margin, spanW) - margin;

                        const y = st.y;

                        // Skip if completely offscreen (should be rare due to margin)
                        if ((xNowWrapped < -margin && xPrevWrapped < -margin) || (xNowWrapped > w + margin && xPrevWrapped > w + margin)) {
                            continue;
                        }

                        // Appearance scales with depth: brighter & thicker when "near"
                        // Add a tiny twinkle modulation (subtle)
                        const twinkle = 0.85 + 0.15 * Math.sin(t * 3.1 + st.twinkle);
                        const alpha = (0.35 + 0.65 * st.depth) * twinkle;
                        const width = Math.max(0.6, 0.6 + 1.8 * st.depth);

                        g.strokeStyle = `rgba(255,255,255,${alpha})`;
                        g.lineWidth = width;

                        const leftEdge  = -margin;
                        const rightEdge = w + margin;

// If the horizontal delta is huge, we crossed an edge this frame.
                        const dx = xNowWrapped - xPrevWrapped;
                        if (dx >  spanW / 2) {
                            // Wrapped left→right (moving left): draw to left edge, then from right edge
                            g.beginPath();
                            g.moveTo(xPrevWrapped, y);
                            g.lineTo(leftEdge, y);
                            g.stroke();

                            g.beginPath();
                            g.moveTo(rightEdge, y);
                            g.lineTo(xNowWrapped, y);
                            g.stroke();
                        } else if (dx < -spanW / 2) {
                            // Wrapped right→left (for completeness)
                            g.beginPath();
                            g.moveTo(xPrevWrapped, y);
                            g.lineTo(rightEdge, y);
                            g.stroke();

                            g.beginPath();
                            g.moveTo(leftEdge, y);
                            g.lineTo(xNowWrapped, y);
                            g.stroke();
                        } else {
                            // Normal short segment
                            g.beginPath();
                            g.moveTo(xPrevWrapped, y);
                            g.lineTo(xNowWrapped, y);
                            g.stroke();
                        }

                        // Optional: a small glint point at the leading edge for very near stars
                        if (st.depth > 0.85) {
                            g.fillStyle = `rgba(255,255,255,${Math.min(1, alpha + 0.2)})`;
                            g.beginPath();
                            g.arc(xNowWrapped, y, 0.8 + st.depth * 0.8, 0, Math.PI * 2);
                            g.fill();
                        }
                    }
                }}
            />
        </div>
    );
}

export default ParallaxStarfield;

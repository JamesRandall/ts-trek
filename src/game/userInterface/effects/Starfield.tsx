import {CanvasSurface} from "../../../components/CanvasSurface.tsx";
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

function frac(x: number): number { return x - Math.floor(x); }

type Star = { x0: number; y0: number; z0: number; jitter: number };

function makeStars(count: number, seed: bigint): Star[] {
    const rng = new LCG(seed);
    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
        const r = Math.sqrt(rng.next());
        const theta = 2 * Math.PI * rng.next();
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z0 = rng.next();
        const jitter = (rng.next() - 0.5) * 0.25;
        stars.push({ x0: x, y0: y, z0, jitter });
    }
    return stars;
}

export function Starfield({
                                  starCount = 1000,
                                  speed = 0.45, // depth units per second
                                  streakSeconds = 0.06,
                                  seed = 42n,
                              }: { starCount?: number; speed?: number; streakSeconds?: number; seed?: bigint }) {
    const starsRef = React.useRef<Star[] | null>(null);

    return (
        <div className="w-full h-full bg-black">
            <CanvasSurface
                context="2d"
                onInit={(ctx) => {
                    starsRef.current = makeStars(Math.max(1, starCount), seed);
                    const g = ctx as CanvasRenderingContext2D;
                    g.imageSmoothingEnabled = false;
                    g.lineCap = "round";
                }}
                onResize={(ctx, s) => {
                    const g = ctx as CanvasRenderingContext2D;
                    g.fillStyle = "black";
                    g.fillRect(0, 0, s.width, s.height);
                }}
                onRender={(ctx, s) => {
                    const g = ctx as CanvasRenderingContext2D;
                    const stars = starsRef.current ?? (starsRef.current = makeStars(Math.max(1, starCount), seed));

                    // Opaque clear
                    g.fillStyle = "black";
                    g.fillRect(0, 0, s.width, s.height);

                    const w = s.width, h = s.height;
                    const cx = w * 0.5, cy = h * 0.5;
                    const baseScale = Math.min(w, h) * 0.55;

                    const t = s.elapsed / 1000; // seconds

                    const margin = 8;
                    const minX = -margin, minY = -margin, maxX = w + margin, maxY = h + margin;

                    for (const st of stars) {
                        const v = Math.max(0.05, speed * (1 + st.jitter));
                        const z = 1 - frac(t * v + st.z0);          // (0,1]
                        const zPrev = Math.min(0.999, z + v * streakSeconds);

                        const px = st.x0 / z, py = st.y0 / z;
                        const qx = st.x0 / zPrev, qy = st.y0 / zPrev;

                        const x1 = cx + px * baseScale, y1 = cy + py * baseScale;
                        const x0 = cx + qx * baseScale, y0 = cy + qy * baseScale;

                        if ((x1 < minX && x0 < minX) || (x1 > maxX && x0 > maxX) || (y1 < minY && y0 < minY) || (y1 > maxY && y0 > maxY)) continue;

                        const closeness = Math.max(0, Math.min(1, 1 - z));
                        const alpha = 0.25 + 0.75 * closeness;
                        const width = Math.max(0.5, 0.5 + 2.0 * closeness);

                        g.strokeStyle = `rgba(255,255,255,${alpha})`;
                        g.lineWidth = width;
                        g.beginPath();
                        g.moveTo(x0, y0);
                        g.lineTo(x1, y1);
                        g.stroke();
                    }
                }}
            />
        </div>
    );
}

export default Starfield;
// ---------- Types ----------
type Vec = { x: number; y: number };
type Poly = Vec[];
type Bounds = { x: number; y: number; w: number; h: number };

type ShockRingOptions = {
    enabled?: boolean;
    color?: string;         // stroke color
    width?: number;         // lineWidth (px)
    durationMs?: number;    // how long the ring animates
    startDelayMs?: number;  // delay after start before ring begins
    maxRadius?: number;     // end radius in px
    easing?: (t: number) => number; // 0..1
    fade?: (t: number) => number;   // alpha curve 0..1
    dash?: number[] | null; // dashed ring e.g. [6, 6]
};

type FlashOptions = {
    enabled?: boolean;
    durationMs?: number;    // how long the flash persists
    maxAlpha?: number;      // peak opacity of the flash
    blurPx?: number;        // optional blur to make it bloom
    easing?: (t: number) => number; // 0..1 (controls alpha over time)
};

type ExplosionOptions = {
    shockRing?: ShockRingOptions;
    flash?: FlashOptions;
};

type Piece = {
    poly: Poly;
    centroid: Vec;
    rot: number;
    rotVel: number;
    vel: Vec;
    maxTravel: number;
    seed: number;

    rotFactor: number;   // fixed random factor [0.75..1.0]
};

type Explosion = {
    origin: Vec;
    img: HTMLImageElement;
    bounds: Bounds;         // image local rect (0,0,w,h)
    pieces: Piece[];
    start: number;          // ms
    duration: number;       // ms total life
    done: boolean;
    onComplete?: () => void;
    // effects
    center: Vec;            // local image center
    opts: Required<ExplosionOptions>;
    // cached tinted silhouette for flash
    _flashCanvas?: HTMLCanvasElement;
};

// ---------- Math ----------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const length = (v: Vec) => Math.hypot(v.x, v.y);
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s });
const norm = (v: Vec): Vec => { const L = length(v) || 1; return { x: v.x / L, y: v.y / L }; };

// Easing helpers
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuad  = (t: number) => 1 - (1 - t) * (1 - t);

// ---------- Polys ----------
function polygonCentroid(poly: Poly): Vec {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const p = poly[i], q = poly[j];
        const f = p.x * q.y - q.x * p.y;
        a += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f;
    }
    a *= 0.5;
    if (Math.abs(a) < 1e-6) {
        const s = poly.reduce((acc, p) => add(acc, p), { x: 0, y: 0 });
        return mul(s, 1 / poly.length);
    }
    return { x: cx / (6 * a), y: cy / (6 * a) };
}

function rectPoly(b: Bounds): Poly {
    return [
        { x: b.x, y: b.y },
        { x: b.x + b.w, y: b.y },
        { x: b.x + b.w, y: b.y + b.h },
        { x: b.x, y: b.y + b.h },
    ];
}

// Half-plane clip ax+by+c>=0
function clipPolyHalfPlane(poly: Poly, a: number, b: number, c: number): Poly {
    const out: Poly = [];
    if (!poly.length) return out;
    const side = (p: Vec) => a * p.x + b * p.y + c;

    for (let i = 0; i < poly.length; i++) {
        const curr = poly[i], prev = poly[(i + poly.length - 1) % poly.length];
        const cIn = side(curr) >= 0, pIn = side(prev) >= 0;
        if (cIn) {
            if (!pIn) { const inter = intersect(prev, curr, a, b, c); if (inter) out.push(inter); }
            out.push(curr);
        } else if (pIn) {
            const inter = intersect(prev, curr, a, b, c); if (inter) out.push(inter);
        }
    }
    return out;
}

function intersect(p: Vec, q: Vec, a: number, b: number, c: number): Vec | null {
    const d = sub(q, p); const denom = a * d.x + b * d.y;
    if (Math.abs(denom) < 1e-8) return null;
    const t = -(a * p.x + b * p.y + c) / denom;
    return { x: p.x + d.x * t, y: p.y + d.y * t };
}

function voronoiCells(points: Vec[], bounds: Bounds): Poly[] {
    const B = rectPoly(bounds);
    return points.map((pi, i) => {
        let cell = B.slice();
        for (let j = 0; j < points.length; j++) {
            if (j === i) continue;
            const pj = points[j];
            const mid = mul(add(pi, pj), 0.5);
            const n = norm(sub(pj, pi)); // normal towards pj
            const a = -n.x, b = -n.y, c = -(a * mid.x + b * mid.y); // keep half-plane towards pi
            cell = clipPolyHalfPlane(cell, a, b, c);
            if (!cell.length) break;
        }
        return cell;
    });
}

// ---------- Piece generation ----------
function rng(seed: number) {
    let s = (seed >>> 0) || 1;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function defaultOptions(drawRect: Bounds): Required<ExplosionOptions> {
    return {
        shockRing: {
            enabled: false,
            color: "#FFFFFF",
            width: 2,
            durationMs: 500,
            startDelayMs: 20,
            maxRadius: Math.max(drawRect.w, drawRect.h) * 0.9,
            easing: easeOutQuad,
            fade: (t: number) => 1 - t,     // linear fade
            dash: [8, 8],                   // dashed by default (paper vibe)
        },
        flash: {
            enabled: false,
            durationMs: 160,
            maxAlpha: 0.55,
            blurPx: 6,
            easing: (t: number) => 1 - t,   // quick decay
        },
    };
}

/**
 * Create an explosion
 */
function createExplosion(
    img: HTMLImageElement,
    drawRect: Bounds,
    startMs: number,
    durationMs = 1200,
    piecesN = 38,
    seed = Math.floor(Math.random() * 1e9),
    options?: ExplosionOptions,
    onComplete?: () => void
): Explosion {
    const rnd = rng(seed);
    const cols = Math.ceil(Math.sqrt(piecesN));
    const rows = Math.ceil(piecesN / cols);

    const pts: Vec[] = [];
    const jitter = 0.42;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols && pts.length < piecesN; c++) {
            const gx = (c + 0.5) / cols, gy = (r + 0.5) / rows;
            const x = drawRect.x + (gx + (rnd() - 0.5) * jitter) * drawRect.w;
            const y = drawRect.y + (gy + (rnd() - 0.5) * jitter) * drawRect.h;
            pts.push({ x, y });
        }
    }

    const cells = voronoiCells(
        pts.map(p => ({ x: p.x, y: p.y })),
        { x: drawRect.x, y: drawRect.y, w: drawRect.w, h: drawRect.h }
    ).map(cell => cell.map(p => ({ x: p.x - drawRect.x, y: p.y - drawRect.y })));

    const imgCenter: Vec = { x: drawRect.w / 2, y: drawRect.h / 2 };

    const pieces: Piece[] = cells.map((poly, idx) => {
        const centroid = polygonCentroid(poly);
        const dir = norm(sub(centroid, imgCenter));
        const baseSpeed = lerp(220, 520, rnd());
        const maxTravel = lerp(drawRect.w * 0.25, drawRect.w * 0.9, rnd());
        const rotVel = (rnd() - 0.5) * 4.0;

        return {
            poly,
            centroid,
            rot: (rnd() - 0.5) * 0.6,
            rotVel,
            vel: mul(dir, baseSpeed),
            maxTravel,
            seed: idx + 1,
            rotFactor: 0.75 + rnd() * 0.25,  // fixed 0.75–1.0 multiplier
        };
    });

    const opts = { ...defaultOptions(drawRect), ...options,
        shockRing: { ...defaultOptions(drawRect).shockRing, ...(options?.shockRing || {}) },
        flash:     { ...defaultOptions(drawRect).flash,     ...(options?.flash || {}) },
    };

    return {
        origin: { x: drawRect.x, y: drawRect.y },
        img,
        bounds: { x: 0, y: 0, w: drawRect.w, h: drawRect.h },
        pieces,
        start: startMs,
        duration: durationMs,
        done: false,
        center: imgCenter,
        opts,
        _flashCanvas: undefined,
        onComplete,
    };
}

// ---------- Rendering helpers ----------
function drawClippedImagePiece(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    localPoly: Poly,
    imgRect: Bounds,
    worldPos: Vec,
    rotation: number,
    alpha: number
) {
    if (localPoly.length < 3 || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;

    const centroid = polygonCentroid(localPoly);
    ctx.translate(worldPos.x + centroid.x, worldPos.y + centroid.y);
    ctx.rotate(rotation);
    ctx.translate(-centroid.x, -centroid.y);

    ctx.beginPath();
    ctx.moveTo(localPoly[0].x, localPoly[0].y);
    for (let i = 1; i < localPoly.length; i++) ctx.lineTo(localPoly[i].x, localPoly[i].y);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, 0, 0, imgRect.w, imgRect.h);
    ctx.restore();
}

// Build a white-tinted silhouette of the image (once per explosion)
function buildWhiteSilhouetteCanvas(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const oc = off.getContext("2d")!;
    // Draw image
    oc.drawImage(img, 0, 0, w, h);
    // Keep image alpha, tint to white
    oc.globalCompositeOperation = "source-in";
    oc.fillStyle = "#FFFFFF";
    oc.fillRect(0, 0, w, h);
    oc.globalCompositeOperation = "source-over";
    return off;
}

function drawShockRing(ctx: CanvasRenderingContext2D, exp: Explosion, nowMs: number) {
    const o = exp.opts.shockRing;
    if (!o.enabled) return;

    const t0 = exp.start + (o.startDelayMs ?? 0);
    const t = (nowMs - t0) / (o.durationMs || 1);
    if (t < 0 || t > 1) return;

    const tt = clamp01(o.easing ? o.easing(t) : t);
    const r = (o.maxRadius ?? 100) * tt;
    const a = clamp01((o.fade ? o.fade(tt) : (1 - tt)));

    ctx.save();
    if (o.dash && o.dash.length) ctx.setLineDash(o.dash);
    ctx.lineWidth = o.width ?? 2;
    ctx.strokeStyle = o.color ?? "#FFFFFF";
    ctx.globalAlpha *= a;

    const cx = exp.origin.x + exp.center.x;
    const cy = exp.origin.y + exp.center.y;

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.01, r), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawFlash(ctx: CanvasRenderingContext2D, exp: Explosion, nowMs: number) {
    const f = exp.opts.flash;
    if (!f.enabled) return;

    const t = (nowMs - exp.start) / (f.durationMs || 1);
    if (t < 0 || t > 1) return;

    const tt = clamp01(f.easing ? f.easing(t) : (1 - t));
    const alpha = (f.maxAlpha ?? 0.5) * tt;
    if (alpha <= 0) return;

    if (!exp._flashCanvas) {
        exp._flashCanvas = buildWhiteSilhouetteCanvas(exp.img, exp.bounds.w, exp.bounds.h);
    }

    ctx.save();
    ctx.globalAlpha *= alpha;
    if ((f.blurPx ?? 0) > 0) ctx.filter = `blur(${f.blurPx}px)`;
    // Draw the white silhouette *behind* shards at the image position
    ctx.drawImage(exp._flashCanvas, exp.origin.x, exp.origin.y);
    ctx.restore();
}

// ---------- Update & Draw ----------
function updateAndDrawExplosion(
    ctx: CanvasRenderingContext2D,
    exp: Explosion,
    nowMs: number
): boolean {
    if (exp.done) return false;

    const t = clamp01((nowMs - exp.start) / exp.duration);

    const alpha = 1 - t;

    // --- Underlay effects ---
    drawFlash(ctx, exp, nowMs);
    drawShockRing(ctx, exp, nowMs);

    // --- Pieces ---
    const lag = 0.08;
    for (const piece of exp.pieces) {
        const pt = clamp01((t - lag * (piece.seed % 7) / 7) / (1 - lag));
        const localTravel = easeOutCubic(pt);
        const dist = piece.maxTravel * (1 - Math.pow(1 - localTravel, 2)); // quadratic ease-out
        const dir = norm(piece.vel);
        const offset = mul(dir, dist);
        const world = add(exp.origin, offset);
        const rot = piece.rot + piece.rotVel * pt * piece.rotFactor;

        drawClippedImagePiece(ctx, exp.img, piece.poly, exp.bounds, world, rot, alpha);
    }

    if (t >= 1) {
        exp.done = true;
        if (exp.onComplete) { exp.onComplete(); }
        return false;
    }
    return true;
}

// ---------- Manager ----------
export function makeExplosionManager() {
    const explosions: Explosion[] = [];

    return {
        /**
         * Trigger an explosion.
         * @param img HTMLImageElement (loaded)
         * @param drawAt {x,y,w,h} where the image is drawn in canvas CSS pixels
         * @param nowMs state.timestamp
         * @param pieces ~30-60 recommended
         * @param durationMs lifetime of shards
         * @param seed deterministic seed (optional)
         * @param options ExplosionOptions (shock ring / flash)
         * @param onComplete callback when an explosion is complete
         */
        trigger(
            img: HTMLImageElement,
            drawAt: Bounds,
            nowMs: number,
            pieces = 40,
            durationMs = 1200,
            seed?: number,
            options?: ExplosionOptions,
            onComplete?: () => void
        ) {
            explosions.push(createExplosion(img, drawAt, nowMs, durationMs, pieces, seed, options, onComplete));
        },
        render(ctx: CanvasRenderingContext2D, nowMs: number) {
            for (let i = explosions.length - 1; i >= 0; i--) {
                const alive = updateAndDrawExplosion(ctx, explosions[i], nowMs);
                if (!alive) explosions.splice(i, 1);
            }
        },
        activeCount() { return explosions.length; }
    };
}

export type LaserOpts = {
    color?: string;      // core color
    width?: number;      // core width in CSS px
    glow?: number;       // glow multiplier (halo size)
    intensity?: number;  // 0..1
    cap?: CanvasLineCap; // 'round' recommended
    dpr?: number;        // provided by CanvasSurface state.dpr
};

// laser.ts (add near drawLaser / drawLaserPath)
export function drawGlint(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    dirX: number, dirY: number,   // unit beam direction (from circle to target)
    size: number,                 // base pixel size (CSS px)
    intensity: number,            // 0..1
    dpr = 1
) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // --- Bloom disc
    ctx.filter = `blur(${size * 0.6 * dpr}px)`;
    const g = ctx.createRadialGradient(x, y, 0, x, y, size * 1.2);
    g.addColorStop(0.0, `rgba(255,255,255,${0.9 * intensity})`);
    g.addColorStop(1.0, `rgba(255,255,255,0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, size * 1.2, 0, Math.PI * 2); ctx.fill();

    // --- Hot core
    ctx.filter = 'none';
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 1.2 * intensity)})`;
    ctx.beginPath(); ctx.arc(x, y, Math.max(1, size * 0.25), 0, Math.PI * 2); ctx.fill();

    // --- Tiny star streaks along the beam direction
    const len = size * (0.9 + 0.6 * intensity);
    const nx = -dirY, ny = dirX; // perpendicular
    ctx.lineCap = 'round';

    const stroke = (lx: number, ly: number, rx: number, ry: number) => {
        ctx.filter = `blur(${0.4 * dpr}px)`;
        ctx.strokeStyle = `rgba(255,255,255,${0.75 * intensity})`;
        ctx.lineWidth = Math.max(1, size * 0.18);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
    };

    // along beam
    stroke(x - dirX * len, y - dirY * len, x + dirX * len, y + dirY * len);
    // perpendicular
    stroke(x - nx * (len * 0.5), y - ny * (len * 0.5), x + nx * (len * 0.5), y + ny * (len * 0.5));

    ctx.restore();
}


export function drawLaser(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    opts: LaserOpts = {}
) {
    const {
        color = '#6cf',
        width = 2,
        glow = 6,
        intensity = 0.95,
        cap = 'round',
        dpr = 1,
    } = opts;

    // Resolve CSS color -> rgb once per draw
    const parseRGBA = (alpha: number) => {
        const c = document.createElement('canvas');
        const cx = c.getContext('2d')!;
        cx.fillStyle = color;
        const normalized = cx.fillStyle as string;
        cx.fillStyle = normalized;
        cx.fillRect(0, 0, 1, 1);
        const [r, g, b] = cx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r},${g},${b},${alpha})`;
    };

    ctx.save();
    ctx.lineCap = cap;
    ctx.globalCompositeOperation = 'lighter';

    // 1) Big soft glow
    ctx.filter = `blur(${(width * glow * 0.6) * dpr}px)`;
    ctx.strokeStyle = parseRGBA(0.5 * intensity);
    ctx.lineWidth = width * glow;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    // 2) Tight halo
    ctx.filter = `blur(${(width * glow * 0.2) * dpr}px)`;
    ctx.strokeStyle = parseRGBA(0.8 * intensity);
    ctx.lineWidth = width * (glow * 0.55);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    // 3) Bright core with gentle longitudinal gradient
    ctx.filter = 'none';
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, parseRGBA(0.95));
    grad.addColorStop(0.5, parseRGBA(1.0));
    grad.addColorStop(1, parseRGBA(0.95));
    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    ctx.restore();
}

export type LaserStrokeOpts = {
    color?: string;
    width?: number;
    glow?: number;
    intensity?: number;
    cap?: CanvasLineCap;
    dpr?: number;
    // Core pass: gradient along path is awkward; default to solid for paths.
    solidCore?: boolean;
}

export function drawLaserPath(
    ctx: CanvasRenderingContext2D,
    buildPath: (ctx: CanvasRenderingContext2D) => void,
    opts: LaserStrokeOpts = {}
) {
    const {
        color = '#6cf',
        width = 2,
        glow = 6,
        intensity = 0.95,
        cap = 'round',
        dpr = 1,
        solidCore = true,
    } = opts;

    // Resolve CSS color -> rgb
    const rgba = (a: number) => {
        const c = document.createElement('canvas');
        const cx = c.getContext('2d')!;
        cx.fillStyle = color;
        const norm = cx.fillStyle as string;
        cx.fillStyle = norm; cx.fillRect(0,0,1,1);
        const [r,g,b] = cx.getImageData(0,0,1,1).data;
        return `rgba(${r},${g},${b},${a})`;
    };

    ctx.save();
    ctx.lineCap = cap;
    ctx.globalCompositeOperation = 'lighter';

    // 1) Big soft glow
    ctx.filter = `blur(${(width * glow * 0.6) * dpr}px)`;
    ctx.strokeStyle = rgba(0.5 * intensity);
    ctx.lineWidth = width * glow;
    ctx.beginPath(); buildPath(ctx); ctx.stroke();

    // 2) Tight halo
    ctx.filter = `blur(${(width * glow * 0.2) * dpr}px)`;
    ctx.strokeStyle = rgba(0.8 * intensity);
    ctx.lineWidth = width * (glow * 0.55);
    ctx.beginPath(); buildPath(ctx); ctx.stroke();

    // 3) Bright core
    ctx.filter = 'none';
    ctx.strokeStyle = solidCore ? rgba(1.0) : color;
    ctx.lineWidth = width;
    ctx.beginPath(); buildPath(ctx); ctx.stroke();

    ctx.restore();
}
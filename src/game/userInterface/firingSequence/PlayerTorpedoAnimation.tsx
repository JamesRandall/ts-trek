import {useCallback, useRef} from 'react';
import { CanvasSurface, type CanvasState } from '../../../components/CanvasSurface.tsx';
import {easeIn, type Vec2} from './beamAnimation.ts';

export type TorpedoLayerProps = {
    p1: Vec2;                 // torpedo source
    p2: Vec2;                 // torpedo target
    seconds: number;          // travel time
    color?: string;
    width?: number;
    glow?: number;
    intensity?: number;
    ease?: boolean;
    loop?: boolean;
    onComplete?: () => void;
};

export function PlayerTorpedoAnimation({
    p1, p2, seconds,
    color = '#f11',
    width = 8,
    glow = 12,
    intensity = 0.95,
    ease = true,
    loop = false,
    onComplete,
}: TorpedoLayerProps) {
    const completedRef = useRef(false);

    const onRender = useCallback((ctx: CanvasRenderingContext2D, state: CanvasState) => {
        const { width: W, height: H, dpr, elapsed } = state;

        // Clear canvas
        ctx.clearRect(0, 0, W, H);

        const E = ease ? easeIn : (x: number) => x;
        const tSec = elapsed / 1000;
        const duration = Math.max(0.0001, seconds);

        // Calculate torpedo position
        const t = loop ? (tSec % duration) : Math.min(tSec, duration);
        
        // Check if animation is complete
        if (!loop && tSec >= duration && !completedRef.current && onComplete) {
            completedRef.current = true;
            onComplete();
        }

        if (completedRef.current && !loop) {
            return;
        }

        // Apply easing to the progress
        const progress = E(t / duration);
        
        // Calculate torpedo position along the path
        const torpedoX = p1.x + (p2.x - p1.x) * progress;
        const torpedoY = p1.y + (p2.y - p1.y) * progress;
        
        // Calculate torpedo direction for orientation
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.hypot(dx, dy) || 1;
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Draw torpedo trail (fading behind the torpedo)
        const trailLength = Math.min(50, distance * 0.3);
        const trailStartX = torpedoX - dirX * trailLength;
        const trailStartY = torpedoY - dirY * trailLength;
        
        drawTorpedoTrail(ctx, trailStartX, trailStartY, torpedoX, torpedoY, {
            color,
            width: width * 0.6,
            glow: glow * 0.8,
            intensity: intensity * 0.7,
            dpr
        });
        
        // Draw main torpedo body
        drawTorpedo(ctx, torpedoX, torpedoY, dirX, dirY, {
            color,
            width,
            glow,
            intensity,
            dpr
        });

    }, [
        p1, p2, seconds, color, width, glow, intensity, ease, loop, onComplete,
    ]);

    return <CanvasSurface onRender={onRender} />;
}

type TorpedoOpts = {
    color: string;
    width: number;
    glow: number;
    intensity: number;
    dpr: number;
};

function drawTorpedo(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    dirX: number, dirY: number,
    opts: TorpedoOpts
) {
    const { color, width, glow, intensity, dpr } = opts;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    // Parse color to RGBA
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

    // Calculate torpedo dimensions
    const torpedoLength = width * 2;
    const torpedoWidth = width;
    
    // Calculate torpedo points (elliptical shape)
    const frontX = x + dirX * torpedoLength * 0.5;
    const frontY = y + dirY * torpedoLength * 0.5;
    const backX = x - dirX * torpedoLength * 0.5;
    const backY = y - dirY * torpedoLength * 0.5;
    

    // 1) Large outer glow
    ctx.filter = `blur(${glow * 1.2 * dpr}px)`;
    const outerGlow = ctx.createRadialGradient(x, y, 0, x, y, glow * 2);
    outerGlow.addColorStop(0, parseRGBA(0.3 * intensity));
    outerGlow.addColorStop(1, parseRGBA(0));
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, glow * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 2) Medium glow around torpedo body
    ctx.filter = `blur(${glow * 0.6 * dpr}px)`;
    ctx.fillStyle = parseRGBA(0.6 * intensity);
    ctx.beginPath();
    ctx.ellipse(x, y, torpedoLength, torpedoWidth, Math.atan2(dirY, dirX), 0, Math.PI * 2);
    ctx.fill();
    
    // 3) Bright torpedo core
    ctx.filter = 'none';
    
    // Create gradient along torpedo length for more realistic lighting
    const gradient = ctx.createLinearGradient(backX, backY, frontX, frontY);
    gradient.addColorStop(0, parseRGBA(0.7 * intensity));
    gradient.addColorStop(0.3, parseRGBA(1.0 * intensity));
    gradient.addColorStop(0.7, parseRGBA(1.0 * intensity));
    gradient.addColorStop(1, parseRGBA(0.9 * intensity));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, torpedoLength * 0.8, torpedoWidth * 0.8, Math.atan2(dirY, dirX), 0, Math.PI * 2);
    ctx.fill();
    
    // 4) Hot core center
    ctx.fillStyle = parseRGBA(1.0);
    ctx.beginPath();
    ctx.ellipse(x, y, torpedoLength * 0.4, torpedoWidth * 0.4, Math.atan2(dirY, dirX), 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawTorpedoTrail(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    opts: TorpedoOpts
) {
    const { color, width, glow, intensity, dpr } = opts;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    
    // Parse color to RGBA
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
    
    // 1) Soft trail glow
    ctx.filter = `blur(${glow * 0.8 * dpr}px)`;
    const trailGradient = ctx.createLinearGradient(x1, y1, x2, y2);
    trailGradient.addColorStop(0, parseRGBA(0));
    trailGradient.addColorStop(0.3, parseRGBA(0.2 * intensity));
    trailGradient.addColorStop(1, parseRGBA(0.6 * intensity));
    
    ctx.strokeStyle = trailGradient;
    ctx.lineWidth = width * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // 2) Bright trail core
    ctx.filter = 'none';
    const coreGradient = ctx.createLinearGradient(x1, y1, x2, y2);
    coreGradient.addColorStop(0, parseRGBA(0));
    coreGradient.addColorStop(0.5, parseRGBA(0.4 * intensity));
    coreGradient.addColorStop(1, parseRGBA(0.8 * intensity));
    
    ctx.strokeStyle = coreGradient;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    ctx.restore();
}

import {useEffect, useRef} from "react";
import {easeOutQuad, makeExplosionManager} from "./explosionManager.ts";
import {CanvasSurface} from "../../../components/CanvasSurface.tsx";

type Props = {
    image: HTMLImageElement;
    sector: { x: number, y: number };
    cellSize: {width: number, height: number};
    onComplete?: () => void;
    onStart?: () => void;
    rotation?: number;
}

export function ExplosionAnimation({image, sector, cellSize, onComplete, onStart, rotation} : Props) {
    const managerRef = useRef<ReturnType<typeof makeExplosionManager> | null>(null);
    const rotatedImageRef = useRef<HTMLImageElement | null>(null);
    const explosionTriggeredRef = useRef<boolean>(false);

    // Function to create a rotated image synchronously
    const createRotatedImage = (sourceImage: HTMLImageElement, rotationDegrees: number): HTMLImageElement => {
        if (!rotationDegrees || rotationDegrees === 0) {
            return sourceImage;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return sourceImage;

        // Set canvas size to accommodate rotation
        const diagonal = Math.sqrt(sourceImage.width * sourceImage.width + sourceImage.height * sourceImage.height);
        canvas.width = diagonal;
        canvas.height = diagonal;

        // Rotate and draw the image
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotationDegrees * Math.PI) / 180);
        ctx.drawImage(sourceImage, -sourceImage.width / 2, -sourceImage.height / 2);
        ctx.restore();

        // Create a new image element and set its src synchronously
        const rotatedImage = new Image();
        rotatedImage.width = canvas.width;
        rotatedImage.height = canvas.height;
        
        // Use the canvas directly as the source - this is synchronous
        rotatedImage.src = canvas.toDataURL();
        
        return rotatedImage;
    };

    // Reset the triggered flag when sector changes (new explosion)
    useEffect(() => {
        explosionTriggeredRef.current = false;
    }, [sector.x, sector.y]);

    // Prepare the rotated image when image or rotation changes
    useEffect(() => {
        if (rotation !== undefined && rotation !== 0) {
            rotatedImageRef.current = createRotatedImage(image, rotation);
        } else {
            rotatedImageRef.current = image;
        }
    }, [image, rotation]);

    return (<CanvasSurface
        onInit={(_, state) => {
            if (!managerRef.current) {
                managerRef.current = makeExplosionManager();
            }

            // Only trigger explosion once per sector position
            if (!explosionTriggeredRef.current && rotatedImageRef.current) {
                explosionTriggeredRef.current = true;
                onStart?.();
                managerRef.current?.trigger(
                    rotatedImageRef.current,
                    { x: sector.x * cellSize.width, y: sector.y * cellSize.height, w: cellSize.width, h: cellSize.height },
                    state.timestamp,
                    44,
                    2000,
                    undefined,
                    {
                        shockRing: {
                            enabled: true,
                            color: "#FFFFFF",
                            width: 2,
                            durationMs: 520,
                            startDelayMs: 30,
                            maxRadius: cellSize.width * 1.333,
                            dash: [10, 10],
                            easing: t => easeOutQuad(t),
                            fade:  t => 1 - t,
                        }
                    },
                    onComplete,
                );
            }
        }}
        onRender={(ctx, state) => {
            ctx.clearRect(0, 0, state.width, state.height);
            managerRef.current?.render(ctx, state.timestamp);
        }}
    />);
}

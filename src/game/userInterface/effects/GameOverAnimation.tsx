import { useState, useEffect, useRef, useCallback } from 'react';
import { CanvasSurface } from "../../../components/CanvasSurface.tsx";
import Starfield from './Starfield.tsx';
import * as htmlToImage from 'html-to-image';


type Fragment = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    width: number;
    height: number;
    sourceX: number;
    sourceY: number;
};

export function GameOverAnimation() {
    const [screenshot, setScreenshot] = useState<HTMLCanvasElement | null>(null);
    const [fragments, setFragments] = useState<Fragment[]>([]);
    const [animationStarted, setAnimationStarted] = useState(false);
    const [showStarfield, setShowStarfield] = useState(false);
    const animationStartTimeRef = useRef<number | null>(null); // Track when animation actually starts

    // Capture the screen when the component mounts
    useEffect(() => {
        const captureScreen = async () => {
            try {
                // Wait for Safari to fully render the page
                await new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        resolve(void 0);
                    } else {
                        window.addEventListener('load', () => resolve(void 0), { once: true });
                    }
                });

                // Add additional delay for Safari to ensure proper rendering
                await new Promise(resolve => setTimeout(resolve, 100));

                // Get actual viewport dimensions at capture time
                const actualWidth = document.documentElement.clientWidth || window.innerWidth;
                const actualHeight = document.documentElement.clientHeight || window.innerHeight;

                // Create a canvas to capture the current page content
                const captureCanvas = document.createElement('canvas');
                const ctx = captureCanvas.getContext('2d')!;

                // Set canvas size to actual viewport size
                captureCanvas.width = actualWidth;
                captureCanvas.height = actualHeight;

                // Use html2canvas-like approach with DOM traversal
                // For a simpler approach, we'll capture the main game container
                const gameContainer = document.querySelector('#root') || document.body;

                // Alternative approach: use the DOM-to-canvas technique
                const data = await domToCanvas(gameContainer as HTMLElement, actualWidth, actualHeight);
                ctx.drawImage(data, 0, 0, actualWidth, actualHeight);

                setScreenshot(captureCanvas);

                // Generate explosion fragments using the actual dimensions
                generateFragments(actualWidth, actualHeight);

                // Start animation after ensuring screenshot is properly set
                setAnimationStarted(true);

            } catch (error) {
                console.warn('Screen capture failed, starting animation without capture:', error);
                setAnimationStarted(true);
            }
        };

        captureScreen();
    }, []);

    // Generate fragments for explosion effect
    const generateFragments = useCallback((width: number, height: number) => {
        const fragmentsArray: Fragment[] = [];
        const fragmentSize = 40; // Size of each fragment

        for (let x = 0; x < width; x += fragmentSize) {
            for (let y = 0; y < height; y += fragmentSize) {
                // Create explosion vectors radiating from center
                const centerX = width / 2;
                const centerY = height / 2;
                const deltaX = x + fragmentSize/2 - centerX;
                const deltaY = y + fragmentSize/2 - centerY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const normalizedX = distance > 0 ? deltaX / distance : 0;
                const normalizedY = distance > 0 ? deltaY / distance : 0;

                // Add some randomness to the explosion
                const speed = (200 + Math.random() * 300) * (1 + distance / Math.max(width, height));
                const randomFactor = 0.3;
                const vx = normalizedX * speed + (Math.random() - 0.5) * speed * randomFactor;
                const vy = normalizedY * speed + (Math.random() - 0.5) * speed * randomFactor;

                fragmentsArray.push({
                    x: x + fragmentSize/2,
                    y: y + fragmentSize/2,
                    vx,
                    vy,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 8,
                    width: fragmentSize,
                    height: fragmentSize,
                    sourceX: x,
                    sourceY: y
                });
            }
        }

        setFragments(fragmentsArray);
    }, []);

    // Canvas rendering function for the explosion effect
    const renderExplosion = useCallback((ctx: CanvasRenderingContext2D, state: { width: number; height: number; elapsed: number }) => {
        if (!screenshot || !animationStarted) {
            // Show the captured screen initially
            if (screenshot) {
                ctx.drawImage(screenshot, 0, 0, state.width, state.height);
            }
            return;
        }

        // Initialize animation start time on first render after animation starts
        if (animationStartTimeRef.current === null) {
            animationStartTimeRef.current = state.elapsed;
            setShowStarfield(true);
        }

        // Calculate time since explosion started (not since canvas mounted)
        const explosionElapsed = state.elapsed - animationStartTimeRef.current;
        const timeSeconds = explosionElapsed / 1000;

        // Don't render anything if we haven't actually started yet
        if (timeSeconds < 0) {
            if (screenshot) {
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
                ctx.drawImage(screenshot, 0, 0, state.width, state.height);
                ctx.restore();
            }
            return;
        }

        // Clear canvas - the Starfield will be visible behind
        ctx.clearRect(0, 0, state.width, state.height);

        const gravity = 200; // pixels per second squared
        const fadeStartTime = 1.5; // Start fading after 1.5 seconds
        const fadeOutDuration = 2.5; // Fade over 2.5 seconds

        fragments.forEach(fragment => {
            // Update position with physics using corrected time
            const currentX = fragment.x + fragment.vx * timeSeconds;
            const currentY = fragment.y + fragment.vy * timeSeconds + 0.5 * gravity * timeSeconds * timeSeconds;
            const currentRotation = fragment.rotation + fragment.rotationSpeed * timeSeconds;

            // Calculate alpha for fade out
            let alpha = 1;
            if (timeSeconds > fadeStartTime) {
                const fadeProgress = (timeSeconds - fadeStartTime) / fadeOutDuration;
                alpha = Math.max(0, 1 - fadeProgress);
            }

            if (alpha <= 0) return; // Skip fully transparent fragments

            // Skip fragments that have moved off screen
            if (currentX < -fragment.width || currentX > state.width + fragment.width ||
                currentY < -fragment.height || currentY > state.height + fragment.height) {
                return;
            }

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(currentX, currentY);
            ctx.rotate(currentRotation);

            // Draw the fragment from the screenshot
            try {
                ctx.drawImage(
                    screenshot,
                    fragment.sourceX, fragment.sourceY, fragment.width, fragment.height,
                    -fragment.width/2, -fragment.height/2, fragment.width, fragment.height
                );
            } catch {
                // Fallback: draw a colored rectangle if image drawing fails
                ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
                ctx.fillRect(-fragment.width/2, -fragment.height/2, fragment.width, fragment.height);
            }

            ctx.restore();
        });

        // Game Over text animation - starts at 2 seconds, zooms in over 2 seconds
        const gameOverStartTime = 2.0; // Start at 2 seconds
        const gameOverDuration = 2.0; // Zoom in over 2 seconds
        
        if (timeSeconds >= gameOverStartTime) {
            const gameOverElapsed = timeSeconds - gameOverStartTime;
            const gameOverProgress = Math.min(gameOverElapsed / gameOverDuration, 1);
            
            // Ease-in-out function for smooth animation
            const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const easedProgress = easeInOut(gameOverProgress);
            
            // Calculate scale - starts tiny (0.1) and grows to full size (1.0)
            const scale = 0.1 + (easedProgress * 0.9);
            
            // Calculate opacity - fades in during the first half of the animation
            const opacity = Math.min(gameOverProgress * 2, 1);
            
            // Center position
            const centerX = state.width / 2;
            const centerY = state.height / 2;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            
            // Configure text styling
            const fontSize = Math.min(state.width, state.height) * 0.10; // Responsive font size
            ctx.font = `bold ${fontSize}px orbitron`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text shadow/outline for better visibility
            ctx.lineWidth = fontSize * 0.1;
            ctx.strokeStyle = 'black';
            ctx.strokeText('GAME OVER', 0, 0);
            
            // Main text
            ctx.fillStyle = 'rgb(232 227 221)'; // Red color
            ctx.fillText('GAME OVER', 0, 0);
            
            ctx.restore();
        }
    }, [screenshot, fragments, animationStarted]);


    return (
        <div className="fixed inset-0 z-50">
            <style>{`
                .starfield-fade-in {
                    animation: starfield-fade-in 3s ease-in forwards;
                    opacity: 0;
                }
                
                @keyframes starfield-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .starfield-fade-in {
                        animation: none !important;
                        opacity: 1;
                    }
                }
            `}</style>

            {screenshot && <>
                {showStarfield && (
                    <>
                        <div className="absolute inset-0 z-40 bg-black " />
                        <div className="absolute inset-0 z-40 starfield-fade-in ">
                            <Starfield speed={0.8} starCount={1500} />
                        </div>
                    </>
                )}

                {/* Explosion overlay */}
                <div className="absolute inset-0 z-50">
                    <CanvasSurface
                        context="2d"
                        onRender={renderExplosion}
                        onInit={(ctx) => {
                            ctx.imageSmoothingEnabled = true;
                            animationStartTimeRef.current = null;
                        }}
                    />
                </div>
            </>}

        </div>
    );
}

async function domToCanvas(element: HTMLElement, width?: number, height?: number): Promise<HTMLCanvasElement> {
    try {
        const viewportWidth = width || document.documentElement.clientWidth || window.innerWidth;
        const viewportHeight = height || document.documentElement.clientHeight || window.innerHeight;
        
        const canvas = await htmlToImage.toCanvas(element, {
            width: viewportWidth,
            height: viewportHeight,
            pixelRatio: 1,
            // Force specific positioning for Safari
            style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
                position: 'absolute',
                top: '0px',
                left: '0px',
            },
            // Use scroll position to ensure we capture the visible area
            // Types suggest x and y don't exist as properties but setting thm makes Safari work :shrug
            x: window.pageXOffset || 0,
            y: window.pageYOffset || 0,
        });
        return canvas;

    } catch (error) {
        console.warn(`html2canvas failed, using fallback: ${error}`);
        // Fallback to mock canvas with correct dimensions
        const fallbackCanvas = document.createElement('canvas');
        const ctx = fallbackCanvas.getContext('2d')!;
        const viewportWidth = width || document.documentElement.clientWidth || window.innerWidth;
        const viewportHeight = height || document.documentElement.clientHeight || window.innerHeight;
        fallbackCanvas.width = viewportWidth;
        fallbackCanvas.height = viewportHeight;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, viewportWidth, viewportHeight);
        return fallbackCanvas;
    }
}

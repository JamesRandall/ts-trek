// src/DosPlayer.tsx
import { useEffect, useRef, useState } from "react";
// Types only (implementation comes from the global loaded by <script>)

declare const Dos: any;

export function DosPlayer() {
    const divRef = useRef<HTMLDivElement>(null);
    const dosInstanceRef = useRef<any>(null);
    const initializingRef = useRef<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [dosSize, setDosSize] = useState({ width: 800, height: 600 }); // Default DOS resolution

    useEffect(() => {
        const calculateScale = () => {
            const padding = 40; // Padding around the emulator
            const availableWidth = window.innerWidth - padding * 2;
            const availableHeight = window.innerHeight - padding * 2;

            const scaleX = availableWidth / dosSize.width;
            const scaleY = availableHeight / dosSize.height;

            // Use the smaller scale to ensure the entire emulator fits
            const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
            setScale(newScale);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);

        return () => window.removeEventListener('resize', calculateScale);
    }, [dosSize.width, dosSize.height]);

    useEffect(() => {
        // Load js-dos CSS dynamically with scoped styles
        const loadScopedCSS = async () => {
            const existingLink = document.querySelector('link[data-js-dos-scoped]');
            if (!existingLink) {
                try {
                    // Fetch the CSS content
                    const response = await fetch('/js-dos.css');
                    const cssText = await response.text();

                    // Scope the CSS to only apply within .js-dos-container
                    const scopedCSS = cssText
                        .split('\n')
                        .map(line => {
                            // Skip empty lines and comments
                            if (!line.trim() || line.trim().startsWith('/*')) return line;

                            // If line contains selectors, scope them
                            if (line.includes('{')) {
                                const [selectors, ...rest] = line.split('{');
                                const scopedSelectors = selectors
                                    .split(',')
                                    .map(selector => `.js-dos-container ${selector.trim()}`)
                                    .join(', ');
                                return `${scopedSelectors} {${rest.join('{')}`;
                            }
                            return line;
                        })
                        .join('\n');

                    // Create and inject the scoped styles
                    const style = document.createElement('style');
                    style.setAttribute('data-js-dos-scoped', 'true');
                    style.textContent = scopedCSS;
                    document.head.appendChild(style);
                } catch (error) {
                    console.warn('Could not load js-dos.css:', error);
                }
            }
        };

        loadScopedCSS();

        if (!divRef.current || initializingRef.current) return;

        let isMounted = true;
        initializingRef.current = true;

        const initializeDos = async () => {
            try {
                // Clear any previous instance
                if (dosInstanceRef.current) {
                    try {
                        if (typeof dosInstanceRef.current.exit === 'function') {
                            await dosInstanceRef.current.exit();
                        }
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    dosInstanceRef.current = null;
                }

                if (isMounted && divRef.current) {
                    // Add a small delay to prevent rapid reinitializations
                    await new Promise(resolve => setTimeout(resolve, 100));

                    if (isMounted) {
                        const dosInstance = await Dos(divRef.current, {
                            wdosboxUrl: "wdosbox.js",
                            url: "/mstrek.jsdos",
                            autoStart: true,
                            kiosk: true
                        });

                        dosInstanceRef.current = dosInstance;

                        // Listen for frame size changes to update our scaling
                        if (dosInstance && typeof dosInstance.onFrameSize === 'function') {
                            dosInstance.onFrameSize((width: number, height: number) => {
                                setDosSize({ width, height });
                            });
                        }
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error initializing Dos:', error);
                    setError(error instanceof Error ? error.message : String(error));
                }
            } finally {
                if (isMounted) {
                    initializingRef.current = false;
                }
            }
        };

        initializeDos();

        return () => {
            isMounted = false;
            initializingRef.current = false;

            // Remove scoped CSS when component unmounts
            const scopedStyle = document.querySelector('style[data-js-dos-scoped]');
            if (scopedStyle) {
                scopedStyle.remove();
            }

            if (dosInstanceRef.current) {
                // Async cleanup without waiting
                setTimeout(async () => {
                    try {
                        if (dosInstanceRef.current && typeof dosInstanceRef.current.exit === 'function') {
                            await dosInstanceRef.current.exit();
                        }
                    } catch (error) {
                        console.warn('Error during cleanup:', error);
                    }
                    dosInstanceRef.current = null;
                }, 0);
            }
        };

    }, []); // Empty dependency array to run only once

    if (error) {
        return (
            <div className="flex items-center justify-center bg-gray-100 text-red-600 min-h-[400px]">
                Error loading game: {error}
            </div>
        );
    }

    return (
        <div
            className="flex items-center justify-center min-h-screen w-full"
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center'
            }}
        >
            <div
                ref={divRef}
                className="js-dos-container"
                style={{
                    width: dosSize.width,
                    height: dosSize.height,
                    minWidth: dosSize.width,
                    minHeight: dosSize.height
                }}
            />
        </div>
    );
}

export default function MouseTrek() {
    return (
        <div className="relative w-full h-full js-dos-container flex flex-col">
            <div className="js-dos-container">
                <DosPlayer />
            </div>
            <div className="w-full absolute bottom-0 flex flex-row justify-center items-center">
                <a className="btn rounded-none bg-black" href="/about/history">Back to TS Trek</a>
            </div>
        </div>
    );
}
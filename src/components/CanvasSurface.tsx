import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * CanvasSurface
 * A reusable canvas component that:
 *  - Fills its parent (100% width/height)
 *  - Scales for devicePixelRatio so it stays crisp
 *  - Exposes lifecycle hooks you can "inject": onInit, onRender, onResize, onDispose
 *  - Drives an animation loop with requestAnimationFrame
 *  - Supports either "2d" or "webgl2" contexts
 */

export type CanvasContextKind = "2d" | "webgl2";

export type CanvasState = {
    width: number;           // CSS pixels
    height: number;          // CSS pixels
    dpr: number;             // devicePixelRatio used for backing store
    frame: number;           // frame counter
    timestamp: number;       // ms since page load
    elapsed: number;         // ms since component mounted (paused time excluded)
};

export type CanvasSurfaceProps<C extends CanvasContextKind = "2d"> = {
    context?: C;
    className?: string;
    style?: React.CSSProperties;
    paused?: boolean;
    /** Called once after context is created */
    onInit?: (
        ctx: C extends "2d" ? CanvasRenderingContext2D : WebGL2RenderingContext,
        state: CanvasState
    ) => void;
    /** Called on every animation frame */
    onRender: (
        ctx: C extends "2d" ? CanvasRenderingContext2D : WebGL2RenderingContext,
        state: CanvasState
    ) => void;
    /** Called whenever the canvas is resized */
    onResize?: (
        ctx: C extends "2d" ? CanvasRenderingContext2D : WebGL2RenderingContext,
        state: CanvasState
    ) => void;
    /** Called when the component is unmounting */
    onDispose?: (
        ctx: C extends "2d" ? CanvasRenderingContext2D : WebGL2RenderingContext,
        state: CanvasState
    ) => void;
    /** Optional fallback if context creation fails */
    fallback?: React.ReactNode;
};

export function CanvasSurface<C extends CanvasContextKind = "2d">({
                                                                      context = "2d" as C,
                                                                      className,
                                                                      style,
                                                                      paused = false,
                                                                      onInit,
                                                                      onRender,
                                                                      onResize,
                                                                      onDispose,
                                                                      fallback,
                                                                  }: CanvasSurfaceProps<C>) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<(CanvasRenderingContext2D | WebGL2RenderingContext) | null>(null);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number>(0);
    const frameRef = useRef<number>(0);
    const [ready, setReady] = useState<boolean>(false);
    const stateRef = useRef<CanvasState>({ width: 0, height: 0, dpr: 1, frame: 0, timestamp: 0, elapsed: 0 });

    // Create context and init
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create context
        let ctx: CanvasRenderingContext2D | WebGL2RenderingContext | null = null;
        if (context === "2d") {
            ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
        } else if (context === "webgl2") {
            ctx = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: true });
        }

        if (!ctx) {
            console.warn("CanvasSurface: failed to create context", context);
            setReady(false);
            return;
        }

        ctxRef.current = ctx;
        startRef.current = performance.now();
        stateRef.current = { ...stateRef.current, timestamp: startRef.current }; // Add this line


        // Initial size + DPR setup
        resizeToParent();

        onInit?.(ctx as never, stateRef.current);
        setReady(true);

        return () => {
            // Cleanup
            cancelRaf();
            onDispose?.(ctx as never, stateRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context]);

    // Handle parent resize & DPR changes
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const ro = new ResizeObserver(() => {
            resizeToParent();
        });
        ro.observe(wrapper);

        // Watch for dpr changes via media queries
        const mq = window.matchMedia(`(resolution: ${Math.round(window.devicePixelRatio)}dppx)`);
        const handleChange = () => resizeToParent();
        mq.addEventListener?.("change", handleChange);

        return () => {
            ro.disconnect();
            mq.removeEventListener?.("change", handleChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Animation loop
    useEffect(() => {
        if (!ready || paused) {
            cancelRaf();
            return;
        }

        const loop = (t: number) => {
            const ctx = ctxRef.current as never;
            if (!ctx) return;

            const state = stateRef.current;
            state.timestamp = t;
            state.frame = frameRef.current++;
            state.elapsed = t - startRef.current;

            onRender(ctx, state);
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        return cancelRaf;
        
    }, [ready, paused, onRender]);

    const cancelRaf = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const resizeToParent = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current as never;
        const wrapper = wrapperRef.current;
        if (!canvas || !ctx || !wrapper) return;

        const rect = wrapper.getBoundingClientRect();
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

        // Only do work if something changed
        const prev = stateRef.current;
        if (prev.width === rect.width && prev.height === rect.height && prev.dpr === dpr) return;

        // Set the CSS size (fill parent)
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Set the backing store size
        const bw = Math.max(1, Math.floor(rect.width * dpr));
        const bh = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== bw) canvas.width = bw;
        if (canvas.height !== bh) canvas.height = bh;

        // For 2D, scale to DPR so drawing code can use CSS pixels
        if (context === "2d") {
            (ctx as CanvasRenderingContext2D).setTransform(1, 0, 0, 1, 0, 0); // reset
            (ctx as CanvasRenderingContext2D).scale(dpr, dpr);
        } else {
            // For WebGL, update viewport
            (ctx as WebGL2RenderingContext).viewport(0, 0, bw, bh);
        }

        stateRef.current = { ...stateRef.current, width: rect.width, height: rect.height, dpr };
        onResize?.(ctx, stateRef.current);
    };

    return (
        <div ref={wrapperRef} className={"relative w-full h-full " + (className || "")} style={style}>
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
                // For accessibility, let screen readers skip canvas unless labelled elsewhere
                role="img"
                aria-label="interactive canvas"
            />
            {!ready && (fallback ?? null)}
        </div>
    );
}
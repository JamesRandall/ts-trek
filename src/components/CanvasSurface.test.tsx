import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import { CanvasSurface } from './CanvasSurface';

// Minimal 2D context mock with the methods the component uses
class Mock2DContext {
  setTransform() {}
  scale() {}
}

// Stubs for browser APIs not present in jsdom
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) { this.callback = cb; }
  observe() {}
  disconnect() {}
}

describe('CanvasSurface', () => {
  beforeEach(() => {
    // Mock canvas.getContext to return our mock context
    vi.spyOn(HTMLCanvasElement.prototype as unknown as { getContext: (type: string) => unknown }, 'getContext').mockImplementation((type: string) => {
      if (type === '2d') return new Mock2DContext() as unknown as CanvasRenderingContext2D;
      return null;
    });

    // Mock devicePixelRatio and matchMedia
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
    window.matchMedia = vi.fn().mockImplementation(() => ({ addEventListener: vi.fn(), removeEventListener: vi.fn() }));

    // Mock ResizeObserver
    // @ts-expect-error assign global
    globalThis.ResizeObserver = MockResizeObserver;

    // Mock RAF
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id as unknown as number));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
    delete (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;
  });

  it('initializes context, resizes to parent and calls onInit/onRender/onResize', async () => {
    const onInit = vi.fn();
    const onRender = vi.fn();
    const onResize = vi.fn();

    // Render the component
    render(
      <div data-testid="wrapper" style={{ width: 200, height: 100 }}>
        <CanvasSurface onInit={onInit} onRender={onRender} onResize={onResize} />
      </div>
    );

    // Force the wrapper to report a certain size
    const wrapper = screen.getByTestId('wrapper');
    // Mock getBoundingClientRect on the wrapper div
    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 100,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 100,
      right: 200,
      toJSON: () => {}
    } as DOMRect);

    // Allow effects and RAF to run
    await act(async () => {
      // One tick for init + one for RAF loop
      await new Promise(r => setTimeout(r, 50));
    });

    expect(onInit).toHaveBeenCalled();
    expect(onResize).toHaveBeenCalled();
    expect(onRender).toHaveBeenCalled();

    // Fallback should not show once ready
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('shows fallback when context creation fails', async () => {
    // Force getContext to return null
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { configurable: true, value: vi.fn(() => null) });

    render(<CanvasSurface onRender={() => {}} fallback={<div>Fallback</div>} />);

    // Effects run
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });
});

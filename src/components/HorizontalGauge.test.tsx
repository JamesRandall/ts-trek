import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import HorizontalGauge from './HorizontalGauge';
import type { RangedValue } from '../game/models/RangedValue';

describe('HorizontalGauge', () => {
  function mockRange(currentValue: number, maxValue = 100, color = 'red'): RangedValue {
    return {
      currentValue,
      maxValue,
      minValue: 0,
      percentageString: () => `${Math.round((currentValue / maxValue) * 100)}%`,
      percentage: () => (currentValue / maxValue) * 100,
      fraction: () => currentValue / maxValue,
      color: () => color,
    } as RangedValue;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    // Polyfill requestAnimationFrame for the animation in the component
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number);
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id as unknown as number));
  });

  afterEach(() => {
    vi.useRealTimers();
    // cleanup globals without using any
    delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
    delete (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;
  });

  it('renders with label and numbers and applies width and color', async () => {
    const range = mockRange(25, 200, 'green');
    render(<HorizontalGauge label="Shields" range={range} />);
    expect(screen.getByText('Shields')).toBeInTheDocument();
    expect(screen.getByText('25/200')).toBeInTheDocument();

    // Gauge bar is the inner absolute div
    const bar = document.querySelector('.absolute.h-full') as HTMLDivElement | null;
    expect(bar).toBeTruthy();

    // Advance timers to allow animation to settle
    await act(async () => {
      vi.runAllTimers();
    });

    if (bar) {
      // 25/200 = 12.5%
      expect(bar.style.width).toContain('12.5%');
      expect(bar.style.backgroundColor).toBe('green');
    }
  });

  it('renders gauge only when no label is provided', () => {
    const range = mockRange(50, 100);
    render(<HorizontalGauge range={range} />);
    // No label present
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });
});

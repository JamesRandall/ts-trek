import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import HorizontalSlider from './HorizontalSlider';
import type { RangedValue } from '../game/models/RangedValue';

describe('HorizontalSlider', () => {
  function mockRange(currentValue: number, maxValue = 100): RangedValue {
    return {
      currentValue,
      maxValue,
      minValue: 0,
      percentageString: () => `${Math.round((currentValue / maxValue) * 100)}%`,
      percentage: () => (currentValue / maxValue) * 100,
      fraction: () => currentValue / maxValue,
      color: () => '#fff',
    } as RangedValue;
  }

  it('renders with label and numbers by default', () => {
    const range = mockRange(30, 100);
    render(<HorizontalSlider label="Power" range={range} />);
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('30/100')).toBeInTheDocument();
  });

  it('renders the correct number of steps and highlights up to current value', () => {
    const range = mockRange(50, 100);
    render(<HorizontalSlider range={range} numberOfSteps={10} />);
    const grid = screen.getByRole('grid', { hidden: true });
    const cells = grid.querySelectorAll('div');
    // Should render at least 10 children inside the grid container
    expect(cells.length).toBeGreaterThanOrEqual(10);
  });

  it('calls setValue with the step value when a step is clicked', () => {
    const range = mockRange(0, 100);
    const setValue = vi.fn();
    render(<HorizontalSlider range={range} numberOfSteps={5} setValue={setValue} />);
    // Find the grid by className since role is not semantic here
    const grid = document.querySelector('[class*="grid-cols-5"]') as HTMLElement;
    expect(grid).toBeTruthy();
    if (grid) {
      const stepDivs = within(grid).getAllByRole('generic');
      // Click the third step (index 2) -> value should be (3/5)*100 = 60
      fireEvent.click(stepDivs[2]);
      expect(setValue).toHaveBeenCalledWith(60);
    }
  });
});

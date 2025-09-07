import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlayPanel } from './OverlayPanel';

describe('OverlayPanel', () => {
  it('renders children and applies width style', () => {
    render(<OverlayPanel borderColor="gamewhite" width={320}><div>Content</div></OverlayPanel>);
    expect(screen.getByText('Content')).toBeInTheDocument();
    const outer = screen.getByText('Content').closest('div')?.parentElement?.parentElement as HTMLDivElement | null;
    expect(outer).toBeTruthy();
    if (outer) {
      expect(outer.style.width).toBe('320px');
    }
  });

  it('fires onClick with event', () => {
    const onClick = vi.fn();
    render(<OverlayPanel borderColor="gamewhite" onClick={onClick}><div>Click me</div></OverlayPanel>);
    const container = screen.getByText('Click me').closest('div')?.parentElement?.parentElement as HTMLDivElement | null;
    expect(container).toBeTruthy();
    if (container) {
      fireEvent.click(container);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    }
  });

  it('applies transparent background class when isTransparentBackground is true', () => {
    render(<OverlayPanel borderColor="gamewhite" isTransparentBackground><div>BG</div></OverlayPanel>);
    // The transparent class is applied to the inner absolute overlay
    const overlay = document.querySelector('.absolute.inset-0.bg-black');
    expect(overlay?.className).toMatch(/opacity-80/);
  });
});

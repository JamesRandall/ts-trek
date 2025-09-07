import { describe, it, vi, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import GameButton from './GameButton';


describe('GameButton', () => {
  it('renders with title and handles click', () => {
    const onClick = vi.fn();
    render(<GameButton title="Engage" onClick={onClick} />);

    const btn = screen.getByRole('button', { name: /engage/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders children if no title', () => {
    render(<GameButton><span>Warp</span></GameButton>);
    expect(screen.getByText('Warp')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true and does not fire click', () => {
    const onClick = vi.fn();
    render(<GameButton title="Disabled" disabled onClick={onClick} />);
    const btn = screen.getByRole('button', { name: /disabled/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies block layout when isBlock is true', () => {
    render(<GameButton title="Block" isBlock />);
    const btn = screen.getByRole('button', { name: /block/i });
    expect(btn.className).toMatch(/w-full/);
  });
});

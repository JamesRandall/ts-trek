import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuButton from './MenuButton';

describe('MenuButton', () => {
  it('renders title and handles click', () => {
    const onClick = vi.fn();
    render(<MenuButton title="Start" onClick={onClick} />);
    const btn = screen.getByRole('button', { name: /start/i });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    render(<MenuButton title="Disabled" disabled onClick={onClick} />);
    const btn = screen.getByRole('button', { name: /disabled/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

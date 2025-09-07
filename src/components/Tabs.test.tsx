import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  const tabs = [
    { key: 'one', label: 'One' },
    { key: 'two', label: 'Two' },
    { key: 'three', label: 'Three' },
  ];

  it('renders tabs and highlights active', () => {
    render(<Tabs activeTab="two" tabs={tabs} onTabChange={() => {}} />);
    const btnTwo = screen.getByRole('button', { name: /two/i });
    expect(btnTwo.className).toMatch(/bg-gamewhite/);
    const btnOne = screen.getByRole('button', { name: /one/i });
    expect(btnOne.className).toMatch(/cursor-pointer/);
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<Tabs activeTab="one" tabs={tabs} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole('button', { name: /three/i }));
    expect(onTabChange).toHaveBeenCalledWith('three');
  });

  it('does not allow clicking when disabled', () => {
    const onTabChange = vi.fn();
    render(<Tabs disabled activeTab="one" tabs={tabs} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole('button', { name: /two/i }));
    expect(onTabChange).not.toHaveBeenCalled();
  });
});

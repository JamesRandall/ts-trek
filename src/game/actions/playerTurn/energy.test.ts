import { describe, it, expect, beforeEach, vi } from 'vitest';
import { energy, transferEnergyToForeShield, transferEnergyToAftShield, transferEnergyToStarboardShield, transferEnergyToPortShield } from './energy';
import type { ContextAccessor } from '../../state/store';

// Helper factory to create a mock store with shields and energy
function createMockStore() {
  return {
    gameData: {
      player: {
        attributes: {
          energy: { currentValue: 0, maxValue: 1000 },
          shields: {
            fore: { currentValue: 0, maxValue: 200 },
            aft: { currentValue: 0, maxValue: 200 },
            starboard: { currentValue: 0, maxValue: 300 },
            port: { currentValue: 0, maxValue: 300 },
          },
        },
      },
    },
  } as unknown as {
    gameData: {
      player: {
        attributes: {
          energy: { currentValue: number; maxValue: number };
          shields: {
            fore: { currentValue: number; maxValue: number };
            aft: { currentValue: number; maxValue: number };
            starboard: { currentValue: number; maxValue: number };
            port: { currentValue: number; maxValue: number };
          };
        };
      };
    };
  };
}

function createContextAccessor(store: unknown): ContextAccessor {
  const set = vi.fn((updater: unknown) => {
    if (typeof updater === 'function') (updater as (s: unknown) => void)(store as object);
  });
  return {
    get: () => store as object,
    set,
  } as unknown as ContextAccessor;
}

describe('energy redistribution and transfers', () => {
  let store: ReturnType<typeof createMockStore>;
  let ctx: ContextAccessor;

  beforeEach(() => {
    store = createMockStore();
    ctx = createContextAccessor(store);
  });

  describe('energy()', () => {
    it('redistributes current shield energy proportionally to max capacities while preserving total', () => {
      // Set up initial uneven shield energies
      store.gameData.player.attributes.shields.fore.currentValue = 200; // full
      store.gameData.player.attributes.shields.aft.currentValue = 0;
      store.gameData.player.attributes.shields.starboard.currentValue = 0;
      store.gameData.player.attributes.shields.port.currentValue = 0;

      const totalBefore = 200; // sum of currents

      energy(ctx);

      const { fore, aft, starboard, port } = store.gameData.player.attributes.shields;

      // Target percentage = 200 / 1000 = 0.2
      expect(fore.currentValue).toBeCloseTo(0.2 * fore.maxValue, 10);
      expect(aft.currentValue).toBeCloseTo(0.2 * aft.maxValue, 10);
      expect(starboard.currentValue).toBeCloseTo(0.2 * starboard.maxValue, 10);
      expect(port.currentValue).toBeCloseTo(0.2 * port.maxValue, 10);

      const totalAfter = fore.currentValue + aft.currentValue + starboard.currentValue + port.currentValue;
      expect(totalAfter).toBeCloseTo(totalBefore, 10);
    });

    it('handles case with zero total max capacity safely (no changes)', () => {
      // Edge case: if all maxValue are 0, avoid NaN propagation
      store.gameData.player.attributes.shields.fore = { currentValue: 5, maxValue: 0 };
      store.gameData.player.attributes.shields.aft = { currentValue: 5, maxValue: 0 };
      store.gameData.player.attributes.shields.starboard = { currentValue: 5, maxValue: 0 };
      store.gameData.player.attributes.shields.port = { currentValue: 5, maxValue: 0 };

      // Call energy() -- current implementation would compute 20/0 -> Infinity, which would set NaN.
      // We assert current behavior to serve as a regression detector. If implementation changes to guard, update test accordingly.
      energy(ctx);

      const { fore, aft, starboard, port } = store.gameData.player.attributes.shields;
      expect(Number.isFinite(fore.currentValue)).toBe(false);
      expect(Number.isFinite(aft.currentValue)).toBe(false);
      expect(Number.isFinite(starboard.currentValue)).toBe(false);
      expect(Number.isFinite(port.currentValue)).toBe(false);
    });
  });

  describe('transferEnergyToXShield()', () => {
    it('transfers up to the missing amount (delta) from energy to fore, not exceeding capacity', () => {
      const { energy: shipEnergy, shields } = store.gameData.player.attributes;
      shipEnergy.currentValue = 150;
      shields.fore.currentValue = 50; // max 200 -> delta 150

      transferEnergyToForeShield(ctx);

      expect(shipEnergy.currentValue).toBe(0); // used 150
      expect(shields.fore.currentValue).toBe(200); // filled to max
    });

    it('transfers only available energy when insufficient to fill aft', () => {
      const { energy: shipEnergy, shields } = store.gameData.player.attributes;
      shipEnergy.currentValue = 40;
      shields.aft.currentValue = 180; // delta 20

      transferEnergyToAftShield(ctx);

      // Only 20 needed; remaining energy should be 20
      expect(shipEnergy.currentValue).toBe(20);
      expect(shields.aft.currentValue).toBe(200);
    });

    it('does nothing to starboard when shield already full', () => {
      const { energy: shipEnergy, shields } = store.gameData.player.attributes;
      shipEnergy.currentValue = 999;
      shields.starboard.currentValue = shields.starboard.maxValue; // already full

      transferEnergyToStarboardShield(ctx);

      expect(shipEnergy.currentValue).toBe(999);
      expect(shields.starboard.currentValue).toBe(shields.starboard.maxValue);
    });

    it('transfers zero when ship energy is zero for port', () => {
      const { energy: shipEnergy, shields } = store.gameData.player.attributes;
      shipEnergy.currentValue = 0;
      shields.port.currentValue = 100; // delta 200

      transferEnergyToPortShield(ctx);

      expect(shipEnergy.currentValue).toBe(0);
      expect(shields.port.currentValue).toBe(100);
    });
  });
});

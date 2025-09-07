
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canWarpTo, beginWarpTo, endWarpTo, setWarpSpeed } from './warpTo';
import { GameState } from '../../models/gameData';
import type { ContextAccessor, ReadonlyContextAccessor } from '../../state/store';

// Mock the verifyState function
vi.mock('../verifyState', () => ({
    verifyState: vi.fn()
}));

// Mock the map utilities
vi.mock('../map', () => ({
    quadrantDistance: vi.fn(),
    objectsInQuadrant: vi.fn().mockReturnValue([]),
}));

// Mock game constants
vi.mock('../../gameConstants', () => ({
    Map: {
        quadrantSize: {
            width: 8,
            height: 8
        }
    }
}));

// Mock utilities
vi.mock('../../utilities', () => ({
    range: (start: number, end: number) => {
        const result = [];
        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        return result;
    }
}));

import { verifyState } from '../verifyState';
import { quadrantDistance } from '../map';

const mockVerifyState = vi.mocked(verifyState);
const mockQuadrantDistance = vi.mocked(quadrantDistance);

describe('warpTo functions', () => {
    let mockGameStore: any;
    let mockContextAccessor: ContextAccessor;
    let mockReadonlyContextAccessor: ReadonlyContextAccessor;

    beforeEach(() => {
        mockGameStore = {
            gameData: {
                state: GameState.PlayerTurn,
                isWarping: false,
                player: {
                    position: {
                        quadrant: { x: 3, y: 3 }
                    },
                    attributes: {
                        energy: {
                            currentValue: 1000,
                            maxValue: 2000
                        },
                        warpSpeed: {
                            currentValue: 5
                        },
                        targetQuadrant: { x: 4, y: 4 },
                        systems: {
                            warpEngines: {
                                fraction: () => 1.0
                            }
                        },
                        shields: {
                            raised: true
                        },
                        weapons: {
                            laserTemperature: {
                                currentValue: 900,
                                maxValue: 1500,
                                minValue: 0,
                            }
                        }
                    }
                },
                quadrantMapped: Array(8).fill(null).map(() => Array(8).fill(false))
            },
            userInterface: {
                isShowingLongRangeScanner: true
            }
        };

        const mockSet = vi.fn((updater) => {
            if (typeof updater === 'function') {
                updater(mockGameStore);
            }
        });

        mockContextAccessor = {
            get: () => mockGameStore,
            set: mockSet
        };

        mockReadonlyContextAccessor = {
            get: () => mockGameStore
        };

        mockVerifyState.mockReturnValue(true);
        mockQuadrantDistance.mockReturnValue(1);
    });

    describe('canWarpTo', () => {
        it('should return true when player has enough energy to warp', () => {
            // Setup: player has plenty of energy
            mockGameStore.gameData.player.attributes.energy.currentValue = 1000;
            mockQuadrantDistance.mockReturnValue(1);

            const result = canWarpTo(mockReadonlyContextAccessor, { x: 4, y: 4 });

            expect(result).toBe(true);
        });

        it('should return false when player does not have enough energy to warp', () => {
            // Setup: player has minimal energy
            mockGameStore.gameData.player.attributes.energy.currentValue = 10;
            mockQuadrantDistance.mockReturnValue(5); // Far distance requiring lots of energy

            const result = canWarpTo(mockReadonlyContextAccessor, { x: 7, y: 7 });

            expect(result).toBe(false);
        });

        it('should calculate distance correctly using quadrantDistance', () => {
            canWarpTo(mockReadonlyContextAccessor, { x: 5, y: 6 });

            expect(mockQuadrantDistance).toHaveBeenCalledWith(
                mockGameStore.gameData.player.position,
                {
                    ...mockGameStore.gameData.player.position,
                    quadrant: { x: 5, y: 6 }
                }
            );
        });

        it('should handle damaged warp engines by increasing energy cost', () => {
            // Setup: heavily damaged warp engines
            mockGameStore.gameData.player.attributes.systems.warpEngines.fraction = () => 0.2;
            mockGameStore.gameData.player.attributes.energy.currentValue = 300;
            mockQuadrantDistance.mockReturnValue(1);

            const result = canWarpTo(mockReadonlyContextAccessor, { x: 4, y: 4 });

            // With damaged engines, even short distances should be expensive
            expect(result).toBe(false);
        });

        it('should handle severely damaged engines (below 0.1) as infinite cost', () => {
            mockGameStore.gameData.player.attributes.systems.warpEngines.fraction = () => 0.05;
            mockGameStore.gameData.player.attributes.energy.currentValue = 10000;

            const result = canWarpTo(mockReadonlyContextAccessor, { x: 4, y: 4 });

            expect(result).toBe(false);
        });
    });

    describe('beginWarpTo', () => {
        it('should set isWarping to true when conditions are met', () => {
            mockGameStore.gameData.player.attributes.energy.currentValue = 1000;

            beginWarpTo(mockContextAccessor);

            expect(mockGameStore.gameData.isWarping).toBe(true);
        });

        it('should not start warping if not in PlayerTurn state', () => {
            mockVerifyState.mockReturnValue(false);
            mockGameStore.gameData.isWarping = false;

            beginWarpTo(mockContextAccessor);

            expect(mockGameStore.gameData.isWarping).toBe(false);
        });

        it('should not start warping if insufficient energy', () => {
            mockGameStore.gameData.player.attributes.energy.currentValue = 1;
            mockGameStore.gameData.isWarping = false;

            beginWarpTo(mockContextAccessor);

            expect(mockGameStore.gameData.isWarping).toBe(false);
        });

        it('should verify player turn state', () => {
            beginWarpTo(mockContextAccessor);

            expect(mockVerifyState).toHaveBeenCalledWith(
                mockContextAccessor.get,
                GameState.PlayerTurn
            );
        });
    });

    describe('endWarpTo', () => {
        it('should complete warp and update player position', () => {
            mockGameStore.gameData.player.attributes.targetQuadrant = { x: 5, y: 6 };
            mockGameStore.gameData.isWarping = true;
            mockGameStore.gameData.player.attributes.energy.currentValue = 1000;

            endWarpTo(mockContextAccessor);

            expect(mockGameStore.gameData.player.position.quadrant).toEqual({ x: 5, y: 6 });
            expect(mockGameStore.gameData.isWarping).toBe(false);
        });

        it('should hide long range scanner after warping', () => {
            mockGameStore.userInterface.isShowingLongRangeScanner = true;

            endWarpTo(mockContextAccessor);

            expect(mockGameStore.userInterface.isShowingLongRangeScanner).toBe(false);
        });

        it('should update energy based on warp calculation', () => {
            const initialEnergy = 1000;
            mockGameStore.gameData.player.attributes.energy.currentValue = initialEnergy;
            mockGameStore.gameData.player.attributes.energy.maxValue = 2000;

            endWarpTo(mockContextAccessor);

            // Energy should change based on warp calculations (generation - consumption)
            expect(mockGameStore.gameData.player.attributes.energy.currentValue).not.toBe(initialEnergy);
        });

        it('should clamp energy to max value', () => {
            // Setup scenario where energy gain would exceed max
            mockGameStore.gameData.player.attributes.energy.currentValue = 1900;
            mockGameStore.gameData.player.attributes.energy.maxValue = 2000;
            mockGameStore.gameData.player.attributes.warpSpeed.currentValue = 1; // Low warp = net gain
            mockQuadrantDistance.mockReturnValue(5); // Long distance for more generation

            endWarpTo(mockContextAccessor);

            expect(mockGameStore.gameData.player.attributes.energy.currentValue).toBeLessThanOrEqual(2000);
        });

        it('should not allow energy to go below 0', () => {
            mockGameStore.gameData.player.attributes.energy.currentValue = 50;
            mockGameStore.gameData.player.attributes.warpSpeed.currentValue = 10; // High warp = high cost

            endWarpTo(mockContextAccessor);

            expect(mockGameStore.gameData.player.attributes.energy.currentValue).toBeGreaterThanOrEqual(0);
        });

        it('should map surrounding quadrants after warping', () => {
            mockGameStore.gameData.player.attributes.targetQuadrant = { x: 3, y: 3 };

            endWarpTo(mockContextAccessor);

            // Check that surrounding quadrants are mapped
            for (let y = 2; y <= 4; y++) {
                for (let x = 2; x <= 4; x++) {
                    expect(mockGameStore.gameData.quadrantMapped[y][x]).toBe(true);
                }
            }
        });

        it('should handle edge quadrants correctly when mapping', () => {
            // Test warping to edge quadrant (0,0)
            mockGameStore.gameData.player.attributes.targetQuadrant = { x: 0, y: 0 };

            endWarpTo(mockContextAccessor);

            // Should not try to map negative indices
            expect(mockGameStore.gameData.quadrantMapped[0][0]).toBe(true);
            expect(mockGameStore.gameData.quadrantMapped[0][1]).toBe(true);
            expect(mockGameStore.gameData.quadrantMapped[1][0]).toBe(true);
        });

        it('should not execute if not in PlayerTurn state', () => {
            mockVerifyState.mockReturnValue(false);
            const initialQuadrant = { ...mockGameStore.gameData.player.position.quadrant };

            endWarpTo(mockContextAccessor);

            expect(mockGameStore.gameData.player.position.quadrant).toEqual(initialQuadrant);
        });
    });

    describe('setWarpSpeed', () => {
        it('should set warp speed within valid range', () => {
            setWarpSpeed(mockContextAccessor, 7);

            expect(mockGameStore.gameData.player.attributes.warpSpeed.currentValue).toBe(7);
        });

        it('should clamp warp speed to minimum value of 1', () => {
            setWarpSpeed(mockContextAccessor, 0.5);

            expect(mockGameStore.gameData.player.attributes.warpSpeed.currentValue).toBe(1);
        });

        it('should clamp warp speed to maximum value of 10', () => {
            setWarpSpeed(mockContextAccessor, 15);

            expect(mockGameStore.gameData.player.attributes.warpSpeed.currentValue).toBe(10);
        });

        it('should handle negative values by clamping to 1', () => {
            setWarpSpeed(mockContextAccessor, -5);

            expect(mockGameStore.gameData.player.attributes.warpSpeed.currentValue).toBe(1);
        });

        it('should accept decimal values and preserve them within range', () => {
            setWarpSpeed(mockContextAccessor, 3.7);

            expect(mockGameStore.gameData.player.attributes.warpSpeed.currentValue).toBe(3.7);
        });
    });

    describe('energy calculation edge cases', () => {
        it('should handle warp factor 4 as energy-neutral at optimal conditions', () => {
            mockGameStore.gameData.player.attributes.warpSpeed.currentValue = 4;
            mockGameStore.gameData.player.attributes.systems.warpEngines.fraction = () => 1.0;
            mockQuadrantDistance.mockReturnValue(1);
            const initialEnergy = mockGameStore.gameData.player.attributes.energy.currentValue;

            endWarpTo(mockContextAccessor);

            // At warp 4 with perfect engines, energy change should be minimal
            const energyChange = Math.abs(mockGameStore.gameData.player.attributes.energy.currentValue - initialEnergy);
            expect(energyChange).toBeLessThan(5); // Allow for small rounding differences
        });

        it('should generate more energy when shields lowered', () => {
            mockGameStore.gameData.player.attributes.warpSpeed.currentValue = 4;
            mockGameStore.gameData.player.attributes.shields.raised = false;
            mockQuadrantDistance.mockReturnValue(1);
            const initialEnergy = mockGameStore.gameData.player.attributes.energy.currentValue;

            endWarpTo(mockContextAccessor);

            // At warp 4 with perfect engines, energy change should be minimal but with the shields lowered their will
            // be a gain
            const energyChange = Math.abs(mockGameStore.gameData.player.attributes.energy.currentValue - initialEnergy);
            expect(energyChange).toBeGreaterThanOrEqual(15); // Allow for small rounding differences
        });

        it('should generate energy at low warp speeds', () => {
            mockGameStore.gameData.player.attributes.warpSpeed.currentValue = 1;
            mockQuadrantDistance.mockReturnValue(2);
            const initialEnergy = mockGameStore.gameData.player.attributes.energy.currentValue;

            endWarpTo(mockContextAccessor);

            // At warp 1, should generate more energy than consumed
            expect(mockGameStore.gameData.player.attributes.energy.currentValue).toBeGreaterThan(initialEnergy);
        });

        it('should consume energy at high warp speeds', () => {
            mockGameStore.gameData.player.attributes.warpSpeed.currentValue = 10;
            mockQuadrantDistance.mockReturnValue(1);
            const initialEnergy = mockGameStore.gameData.player.attributes.energy.currentValue;

            endWarpTo(mockContextAccessor);

            // At warp 10, should consume more energy than generated
            expect(mockGameStore.gameData.player.attributes.energy.currentValue).toBeLessThan(initialEnergy);
        });
    });
});
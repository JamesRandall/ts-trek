import {create} from "zustand";
import {devtools, persist} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";
import {createNewGame} from "../models/gameFactory.ts";
import {FiringSequenceActionType, type GameData} from "../models/gameData.ts";
import {toggleShieldStatus} from "../actions/playerTurn/toggleShieldStatus.ts";
import {impulseTo} from "../actions/playerTurn/impulseTo.ts";
import type {GameObject} from "../models/gameObject.ts";
import {addTarget, canAddTarget, removeTarget} from "../actions/playerTurn/targetting.ts";
import {
    beginFiringSequence,
    nextFiringSequenceItem
} from "../actions/playerTurn/firingSequence.ts";
import {
    energy,
    transferEnergyToAftShield,
    transferEnergyToForeShield, transferEnergyToPortShield,
    transferEnergyToStarboardShield
} from "../actions/playerTurn/energy.ts";
import {objectsInQuadrant} from "../actions/map.ts";
import {beginWarpTo, canWarpTo, endWarpTo, setWarpSpeed} from "../actions/playerTurn/warpTo.ts";
import {setPhaserPower} from "../actions/playerTurn/weaponSetup.ts";
import {endActorTurn, endTurn} from "../actions/enemyTurn/endTurn.ts";
import {applyPhasersToPlayer} from "../actions/enemyTurn/phasers.ts";
import {
    calculateNonPrioritisedRepairCosts,
    calculatePrioritisedRepairCosts,
    repair,
    togglePrioritisedSystem
} from "../actions/playerTurn/repair.ts";
import {patchRangedValues} from "../models/RangedValue.ts";

export const AiActorAction = {
    FirePhasers: 'FirePhasers',
    Move: 'Move',
    Flee: 'Flee'
} as const;

export type AiActorAction = typeof AiActorAction[keyof typeof AiActorAction];

export type GameStore = {
    gameData: GameData;

    // Router
    currentPath: string;
    setPath: (path:string) => void;
    pendingNav: string | null;
    requestNav: (to: string) => void;
    clearPendingNav: () => void;

    // Game
    startGame: () => void;
    userInterface: {
        isDisabled : boolean;
        showTipLog: boolean;
        hideTipLog: () => void;
        selectGameObject: (go:GameObject|null) => void;
        isShowingLongRangeScanner: boolean;
        showLongRangeScanner: () => void;
        hideLongRangeScanner: () => void;
        isShowingSystemStatus: boolean;
        showSystemStatus: () => void;
        hideSystemStatus: () => void;
        isShowingLogs: boolean;
        showLogs: () => void;
        hideLogs: () => void;
        isShowingMenu: boolean;
        showMenu: () => void;
        hideMenu: () => void;
        gameObjectRotations: { [key:string]: number };
        setGameObjectRotation: (go:GameObject, rotation:number) => void;
        clearGameObjectRotations: () => void;
    }
    playerTurn: {
        canAddTarget: () => boolean;
        removeTarget: (go:GameObject|number) => void;
        addTarget: (go:GameObject, numberOfTimes?:number) => void;
        toggleShieldStatus: () => void;
        impulseTo: (x: number, y: number) => void;
        firePhasers: () => void;
        setPhaserPower: (power: number) => void;
        fireTorpedoes: () => void;
        nextFiringSequenceItem: () => void;
        setTargetQuadrant: (quadrant: { x: number, y: number }) => void;
        equalizeShieldEnergy: () => void;
        transferEnergyToForeShield: () => void;
        transferEnergyToAftShield: () => void;
        transferEnergyToStarboardShield: () => void;
        transferEnergyToPortShield: () => void;
        beginWarpTo: () => void;
        endWarpTo: () => void;
        canWarpTo: (quadrant: {x:number, y:number}) => boolean;
        setWarpSpeed: (speed: number) => void;
        toggleRepairPriority: (systemName: string) => void;
        prioritisedRepairCosts: () => number;
        nonPrioritisedRepairCosts: () => number;
        repair: (time: number) => void;
        canRepair: boolean;
        canFirePhasers: boolean;
        canFireTorpedoes: boolean;
    },
    enemyTurn: {
        aiActorSequence: string[];
        currentActorAction: AiActorAction | null;
        setActorAction: (action: AiActorAction | null) => void;
        endActorTurn: () => void;
        endTurn: () => void;
        applyPhasersToPlayer: () => void;
    }
    map: {
        objectsInQuadrant: (quadrant: { x: number, y: number }) => GameObject[];
    }
}

export type ReadonlyContextAccessor = {
    get: () => Readonly<GameStore>;
}

export type ContextAccessor = {
    get: () => GameStore;
    set: (partial: Partial<GameStore> | ((state: GameStore) => void)) => void;
}

export const useGameStore = create<GameStore>()(
    devtools(
        persist(
        immer((set, get) => ({
            gameData: createNewGame(),
            currentPath: '/',
            // Router
            setPath: (path:string) => set({currentPath: path}),
            // Using the router from the store
            pendingNav: null,
            requestNav: (to) => set({ pendingNav: to }),
            clearPendingNav: () => set({ pendingNav: null }),

            // Game
            startGame: () => {
                set((state) => {
                    state.gameData = createNewGame();
                    get().requestNav('/game');
                })
            },

            userInterface: {
                isDisabled: false,
                showTipLog: false,
                hideTipLog: () => { set((state) => { state.userInterface.showTipLog = false; }); },
                selectGameObject: (go:GameObject|null) => {
                    set((state) => {
                        state.gameData.selectedGameObject = go;
                    });
                },
                isShowingLongRangeScanner: false,
                showLongRangeScanner: () => { set((state) => { state.userInterface.isShowingLongRangeScanner = true; }); },
                hideLongRangeScanner: () => { set((state) => { state.userInterface.isShowingLongRangeScanner = false; }); },
                isShowingSystemStatus: false,
                showSystemStatus: () => { set((state) => { state.userInterface.isShowingSystemStatus = true; }); },
                hideSystemStatus: () => { set((state) => { state.userInterface.isShowingSystemStatus = false; }); },
                isShowingLogs: false,
                showLogs: () => { set((state) => { state.userInterface.isShowingLogs = true; }); },
                hideLogs: () => { set((state) => { state.userInterface.isShowingLogs = false; }); },
                isShowingMenu: false,
                showMenu: () => { set((state) => { state.userInterface.isShowingMenu = true; }); },
                hideMenu: () => { set((state) => { state.userInterface.isShowingMenu = false; }); },
                gameObjectRotations: {},
                setGameObjectRotation: (go:GameObject, rotation:number) => { set((state) => { state.userInterface.gameObjectRotations[go.id] = rotation; });},
                clearGameObjectRotations: () => { set((state) => { state.userInterface.gameObjectRotations = {}; }); },
            },

            map: {
                objectsInQuadrant: (quadrant:{x:number,y:number}) => objectsInQuadrant({get}, quadrant),
            },

            playerTurn: {
                canAddTarget: () => canAddTarget({get}),
                addTarget: (go,numberOfTimes) => addTarget({get, set}, go, numberOfTimes),
                removeTarget: (go) => removeTarget({get, set}, go),
                toggleShieldStatus: () => toggleShieldStatus({get, set}),
                impulseTo: (x, y) => impulseTo({get,set}, {x, y}),
                firePhasers: () => beginFiringSequence({get, set}, FiringSequenceActionType.Phasers),
                fireTorpedoes: () => beginFiringSequence({get, set}, FiringSequenceActionType.Torpedoes),
                setPhaserPower: (power) => setPhaserPower({get,set}, power),
                nextFiringSequenceItem: () => nextFiringSequenceItem({get, set}),
                equalizeShieldEnergy: () => energy({get, set}),
                transferEnergyToForeShield: () => transferEnergyToForeShield({get,set}),
                transferEnergyToAftShield: () => transferEnergyToAftShield({get,set}),
                transferEnergyToStarboardShield: () => transferEnergyToStarboardShield({get,set}),
                transferEnergyToPortShield: () => transferEnergyToPortShield({get,set}),
                setTargetQuadrant: (quadrant:{x:number, y:number}) => set((state) => {state.gameData.player.attributes.targetQuadrant = {...quadrant}}),
                beginWarpTo: () => beginWarpTo({get,set}),
                endWarpTo: () => endWarpTo({get,set}),
                canWarpTo: (quadrant) => canWarpTo({get}, quadrant),
                setWarpSpeed: (speed) => setWarpSpeed({get,set}, speed),
                toggleRepairPriority: (systemName: string) => togglePrioritisedSystem({get,set}, systemName),
                prioritisedRepairCosts: () => calculatePrioritisedRepairCosts({get}),
                nonPrioritisedRepairCosts: () => calculateNonPrioritisedRepairCosts({get}),
                repair: (time) => repair({get, set}, time),
                canRepair: false,
                canFirePhasers: false,
                canFireTorpedoes: false
            },

            enemyTurn: {
                aiActorSequence: [],
                currentActorAction: null,
                setActorAction: (action) => set(state => { state.enemyTurn.currentActorAction = action; }),
                endTurn: () => endTurn({get, set}),
                endActorTurn: () => endActorTurn({get, set}),
                applyPhasersToPlayer: () => applyPhasersToPlayer({get,set})
            }
        })),
        {
            name: 'ts-trek-game-store',
            partialize: (state) => ({
                gameData: state.gameData,
                version: 1,
                userInterface: {
                    isDisabled: state.userInterface.isDisabled,
                    showTipLog: state.userInterface.showTipLog,
                    isShowingLongRangeScanner: state.userInterface.isShowingLongRangeScanner,
                    isShowingSystemStatus: state.userInterface.isShowingSystemStatus,
                    isShowingLogs: state.userInterface.isShowingLogs,
                    isShowingMenu: state.userInterface.isShowingMenu,
                    gameObjectRotations: state.userInterface.gameObjectRotations,
                }
            }),
            onRehydrateStorage: () => {
                return (state:any) => {
                    if (state) {
                        // Apply patching to the entire rehydrated state
                        patchRangedValues(state);
                    }
                    return state;
                }
            },
            merge: (persistedState:any, currentState:any) => {
                // Merge persisted state with current state, preserving functions
                return {
                    ...currentState,
                    ...persistedState,
                    userInterface: {
                        ...currentState.userInterface,
                        ...persistedState.userInterface,
                    }
                };
            }

        })
    )
);

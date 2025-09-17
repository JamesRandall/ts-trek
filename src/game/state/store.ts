import {create} from "zustand";
import {devtools, persist} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";
import {createNewGame} from "../models/gameFactory.ts";
import {FiringSequenceActionType, type GameData, GameState} from "../models/gameData.ts";
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
    transferEnergyToStarboardShield, transferShieldEnergyToMain
} from "../actions/playerTurn/energy.ts";
import {objectsInQuadrant} from "../actions/map.ts";
import {beginWarpTo, canWarpTo, endWarpTo, setWarpSpeed} from "../actions/playerTurn/warpTo.ts";
import {setPhaserPower} from "../actions/playerTurn/weaponSetup.ts";
import {endActorTurn, endTurn} from "../actions/enemyTurn/endTurn.ts";
import {applyPhasersToPlayer} from "../actions/enemyTurn/phasers.ts";
import {
    calculateNonPrioritisedRepairCosts,
    calculatePrioritisedRepairCosts,
    repair, setPercentageHealth,
    togglePrioritisedSystem
} from "../actions/playerTurn/repair.ts";
import {patchRangedValues} from "../models/RangedValue.ts";
import {dock, undock} from "../actions/playerTurn/docking.ts";
import {startSelfDestruct, cancelSelfDestruct, completeSelfDestruct} from "../actions/playerTurn/selfDestruct.ts";

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
    resetGame: () => void;
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
        showStartSelfDestruct: () => void;
        hideStartSelfDestruct: () => void;
        isShowingStartSelfDestruct: boolean;
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
        transferShieldEnergyToMain: () => void;
        beginWarpTo: () => void;
        endWarpTo: () => void;
        canWarpTo: (quadrant: {x:number, y:number}) => boolean;
        setWarpSpeed: (speed: number) => void;
        toggleRepairPriority: (systemName: string) => void;
        prioritisedRepairCosts: () => number;
        nonPrioritisedRepairCosts: () => number;
        repair: (time: number) => void;
        dock: () => void;
        undock: () => void;
        cancelSelfDestruct: () => void;
        startSelfDestruct: () => void;
        completeSelfDestruct: () => void;
        setPercentageHealth: (systemKey:string,percentage:number) => void;
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

const userInterfaceDefaults = {
    isDisabled: false,
    showTipLog: false,
    isShowingLongRangeScanner: false,
    isShowingSystemStatus: false,
    isShowingLogs: false,
    isShowingMenu: false,
    isShowingStartSelfDestruct: false,
    gameObjectRotations: {},
}

const playerTurnDefaults = {

}

const enemyTurnDefaults = {
    aiActorSequence: [],
    currentActorAction: null,
}

export const useGameStore = create<GameStore>()(
    devtools(
        persist(
        immer((set, get) => ({
            gameData: { ...createNewGame(), gameState: GameState.NoGame },
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
                    state.userInterface = { ...state.userInterface, ...userInterfaceDefaults };
                    state.playerTurn = { ...state.playerTurn, ...playerTurnDefaults };
                    state.enemyTurn = { ...state.enemyTurn, ...enemyTurnDefaults };
                    get().requestNav('/game');
                })
            },
            resetGame: () => {
                set((state) => {
                    state.gameData = createNewGame();
                    state.gameData.gameState = GameState.NoGame;
                    state.userInterface = { ...state.userInterface, ...userInterfaceDefaults };
                    state.playerTurn = { ...state.playerTurn, ...playerTurnDefaults };
                    state.enemyTurn = { ...state.enemyTurn, ...enemyTurnDefaults };
                })
            },

            userInterface: {
                ...userInterfaceDefaults,
                hideTipLog: () => { set((state) => { state.userInterface.showTipLog = false; }); },
                selectGameObject: (go:GameObject|null) => {
                    set((state) => {
                        state.gameData.selectedGameObject = go;
                    });
                },
                showLongRangeScanner: () => { set((state) => { state.userInterface.isShowingLongRangeScanner = true; }); },
                hideLongRangeScanner: () => { set((state) => { state.userInterface.isShowingLongRangeScanner = false; }); },
                showSystemStatus: () => { set((state) => { state.userInterface.isShowingSystemStatus = true; }); },
                hideSystemStatus: () => { set((state) => { state.userInterface.isShowingSystemStatus = false; }); },
                showLogs: () => { set((state) => { state.userInterface.isShowingLogs = true; }); },
                hideLogs: () => { set((state) => { state.userInterface.isShowingLogs = false; }); },
                showMenu: () => { set((state) => { state.userInterface.isShowingMenu = true; }); },
                hideMenu: () => { set((state) => { state.userInterface.isShowingMenu = false; }); },
                setGameObjectRotation: (go:GameObject, rotation:number) => { set((state) => { state.userInterface.gameObjectRotations[go.id] = rotation; });},
                clearGameObjectRotations: () => { set((state) => { state.userInterface.gameObjectRotations = {}; }); },
                showStartSelfDestruct: () => { set(state => { state.userInterface.isShowingStartSelfDestruct = true; })},
                hideStartSelfDestruct: () => { set(state => { state.userInterface.isShowingStartSelfDestruct = false; })}
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
                transferShieldEnergyToMain: () => transferShieldEnergyToMain({get,set}),
                setTargetQuadrant: (quadrant:{x:number, y:number}) => set((state) => {state.gameData.player.attributes.targetQuadrant = {...quadrant}}),
                beginWarpTo: () => beginWarpTo({get,set}),
                endWarpTo: () => endWarpTo({get,set}),
                canWarpTo: (quadrant) => canWarpTo({get}, quadrant),
                setWarpSpeed: (speed) => setWarpSpeed({get,set}, speed),
                toggleRepairPriority: (systemName: string) => togglePrioritisedSystem({get,set}, systemName),
                prioritisedRepairCosts: () => calculatePrioritisedRepairCosts({get}),
                nonPrioritisedRepairCosts: () => calculateNonPrioritisedRepairCosts({get}),
                repair: (time) => repair({get, set}, time),
                dock: () => dock({get, set}),
                undock: () => undock({get, set}),
                cancelSelfDestruct: () => cancelSelfDestruct({get, set}),
                startSelfDestruct: () => startSelfDestruct({get, set}),
                completeSelfDestruct: () => completeSelfDestruct({get, set}),
                setPercentageHealth: (systemKey,percentage) => setPercentageHealth({get, set}, systemKey, percentage),
            },

            enemyTurn: {
                setActorAction: (action) => set(state => { state.enemyTurn.currentActorAction = action; }),
                endTurn: () => endTurn({get, set}),
                endActorTurn: () => endActorTurn({get, set}),
                applyPhasersToPlayer: () => applyPhasersToPlayer({get,set}),
                ...enemyTurnDefaults
            }
        })),
        {
            name: 'ts-trek-game-store',
            partialize: (state) => ({
                gameData: state.gameData,
                version: 1,
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
                        ...currentState.userInterface
                    }
                };
            }

        })
    )
);

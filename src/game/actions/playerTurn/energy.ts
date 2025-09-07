import type {ContextAccessor} from "../../state/store.ts";

export function energy({set}:ContextAccessor) {
    set(state => {
        const shields = state.gameData.player.attributes.shields;

        // Calculate total energy and total max capacity across all shield quadrants
        const totalCurrentEnergy = shields.fore.currentValue + shields.aft.currentValue + shields.starboard.currentValue + shields.port.currentValue;
        const totalMaxCapacity = shields.fore.maxValue + shields.aft.maxValue + shields.starboard.maxValue + shields.port.maxValue;

        // Calculate the target percentage that all shields should have
        const targetPercentage = totalCurrentEnergy / totalMaxCapacity;

        // Set each shield to the target percentage of its max capacity
        shields.fore.currentValue = targetPercentage * shields.fore.maxValue;
        shields.aft.currentValue = targetPercentage * shields.aft.maxValue;
        shields.starboard.currentValue = targetPercentage * shields.starboard.maxValue;
        shields.port.currentValue = targetPercentage * shields.port.maxValue;
    });
}

export function transferEnergyToForeShield({set}:ContextAccessor) {
    set(state => {
        const fore = state.gameData.player.attributes.shields.fore;
        const energy = state.gameData.player.attributes.energy;
        const delta = fore.maxValue - fore.currentValue;
        const toTransfer = Math.min(energy.currentValue, delta);
        energy.currentValue -= toTransfer;
        fore.currentValue += toTransfer;
    });
}

export function transferEnergyToAftShield({set}:ContextAccessor) {
    set(state => {
        const aft = state.gameData.player.attributes.shields.aft;
        const energy = state.gameData.player.attributes.energy;
        const delta = aft.maxValue - aft.currentValue;
        const toTransfer = Math.min(energy.currentValue, delta);
        energy.currentValue -= toTransfer;
        aft.currentValue += toTransfer;
    })
}

export function transferEnergyToStarboardShield({set}:ContextAccessor) {
    set(state => {
        const starboard = state.gameData.player.attributes.shields.starboard;
        const energy = state.gameData.player.attributes.energy;
        const delta = starboard.maxValue - starboard.currentValue;
        const toTransfer = Math.min(energy.currentValue, delta);
        energy.currentValue -= toTransfer;
        starboard.currentValue += toTransfer;
    })
}

export function transferEnergyToPortShield({set}:ContextAccessor) {
    set(state => {
        const port = state.gameData.player.attributes.shields.port;
        const energy = state.gameData.player.attributes.energy;
        const delta = port.maxValue - port.currentValue;
        const toTransfer = Math.min(energy.currentValue, delta);
        energy.currentValue -= toTransfer;
        port.currentValue += toTransfer;
    });
}

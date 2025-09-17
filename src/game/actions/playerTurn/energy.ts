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

export function transferShieldEnergyToMain({set}:ContextAccessor) {
    set(state => {
        const shields = state.gameData.player.attributes.shields;
        const energy = state.gameData.player.attributes.energy;
        
        // Calculate how much energy we can add to main energy
        const energyNeeded = energy.maxValue - energy.currentValue;
        if (energyNeeded <= 0) return; // Main energy is already full
        
        // Get all shield quadrants
        const shieldQuadrants = [shields.fore, shields.aft, shields.starboard, shields.port];
        
        // Calculate total available shield energy
        const totalShieldEnergy = shieldQuadrants.reduce((sum, shield) => sum + shield.currentValue, 0);
        
        // Determine how much energy to transfer (limited by what's needed and what's available)
        const energyToTransfer = Math.min(energyNeeded, totalShieldEnergy);
        
        if (energyToTransfer <= 0) return; // No energy available in shields
        
        let remainingToTransfer = energyToTransfer;
        
        // First pass: try to take equally from all shields
        while (remainingToTransfer > 0) {
            // Find shields that still have energy
            const shieldsWithEnergy = shieldQuadrants.filter(shield => shield.currentValue > 0);
            
            if (shieldsWithEnergy.length === 0) break;
            
            // Calculate how much to take from each shield in this pass
            const perShieldAmount = Math.min(
                remainingToTransfer / shieldsWithEnergy.length,
                Math.min(...shieldsWithEnergy.map(shield => shield.currentValue))
            );
            
            if (perShieldAmount <= 0) break;
            
            // Take energy from each shield
            for (const shield of shieldsWithEnergy) {
                const actualTransfer = Math.min(perShieldAmount, shield.currentValue, remainingToTransfer);
                shield.currentValue -= actualTransfer;
                remainingToTransfer -= actualTransfer;
                
                if (remainingToTransfer <= 0) break;
            }
        }
        
        // Add the transferred energy to main energy
        energy.currentValue += (energyToTransfer - remainingToTransfer);
    });
}
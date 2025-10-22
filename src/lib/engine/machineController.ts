import type { Machine } from '$lib/types/game';
import { gameState } from '$lib/stores/gameState.svelte';

export function updateMachines() {
	for (const machine of gameState.machines) {
		if (!machine.active || !machine.recipe) continue;

		// Check if we have enough inputs
		const hasInputs = machine.recipe.inputs.every(input => {
			const available = machine.inventory.get(input.resourceId) || 0;
			return available >= input.amount;
		});

		if (!hasInputs) {
			machine.progress = 0;
			continue;
		}

		// Consume energy
		if (!gameState.consumeEnergy(machine.recipe.energyCost / machine.recipe.productionTime)) {
			machine.active = false;
			continue;
		}

		// Update progress
		machine.progress += 1;

		// Production complete
		if (machine.progress >= machine.recipe.productionTime) {
			// Consume inputs
			machine.recipe.inputs.forEach(input => {
				const current = machine.inventory.get(input.resourceId) || 0;
				machine.inventory.set(input.resourceId, current - input.amount);
			});

			// Produce outputs
			machine.recipe.outputs.forEach(output => {
				const current = machine.outputInventory.get(output.resourceId) || 0;
				machine.outputInventory.set(output.resourceId, current + output.amount);
			});

			machine.progress = 0;
		}
	}
}

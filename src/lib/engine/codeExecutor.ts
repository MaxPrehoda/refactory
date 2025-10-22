import type { Robot, CodeExecutionContext, ResourceNode, Machine, Position } from '$lib/types/game';
import { gameState } from '$lib/stores/gameState.svelte';

// Energy cost for different operations
const ENERGY_COSTS = {
	MOVE: 0.1,
	PICKUP: 0.5,
	DROPOFF: 0.5,
	FUNCTION_CALL: 0.01
};

// Track profiling data
export const profilingData = new Map<string, { calls: number; totalTime: number; energyUsed: number }>();

// Create a safe execution context for each robot
function createExecutionContext(robot: Robot): CodeExecutionContext {
	const distance = (p1: Position, p2: Position) => {
		return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	};

	return {
		robot: { ...robot },
		getNearbyResources: (radius: number) => {
			return gameState.resourceNodes.filter(node =>
				distance(robot.position, node.position) <= radius
			);
		},
		getNearbyMachines: (radius: number) => {
			return gameState.machines.filter(machine =>
				distance(robot.position, machine.position) <= radius
			);
		},
		moveTo: (position: Position) => {
			if (!gameState.consumeEnergy(ENERGY_COSTS.MOVE)) {
				throw new Error('Insufficient energy');
			}
			gameState.updateRobot(robot.id, {
				targetPosition: position,
				status: 'moving'
			});
		},
		pickup: (resourceNode: ResourceNode) => {
			if (!gameState.consumeEnergy(ENERGY_COSTS.PICKUP)) {
				throw new Error('Insufficient energy');
			}

			if (distance(robot.position, resourceNode.position) > 10) {
				throw new Error('Too far from resource node');
			}

			if (robot.carrying) {
				throw new Error('Already carrying something');
			}

			gameState.updateRobot(robot.id, {
				carrying: resourceNode.resourceType,
				carryAmount: 1,
				status: 'working'
			});
		},
		dropoff: (machine: Machine) => {
			if (!gameState.consumeEnergy(ENERGY_COSTS.DROPOFF)) {
				throw new Error('Insufficient energy');
			}

			if (distance(robot.position, machine.position) > 10) {
				throw new Error('Too far from machine');
			}

			if (!robot.carrying) {
				throw new Error('Not carrying anything');
			}

			// Add to machine inventory
			const currentAmount = machine.inventory.get(robot.carrying) || 0;
			machine.inventory.set(robot.carrying, currentAmount + robot.carryAmount);

			gameState.updateRobot(robot.id, {
				carrying: null,
				carryAmount: 0,
				status: 'idle'
			});
		},
		wait: (ticks: number) => {
			// Implemented via robot status
		},
		getInventory: () => ({
			type: robot.carrying,
			amount: robot.carryAmount
		})
	};
}

// Execute player code with sandboxing and error handling
export function executePlayerCode() {
	const activeCode = gameState.activeCode;
	if (!activeCode) return;

	// Execute code for each robot
	for (const robot of gameState.robots) {
		try {
			const context = createExecutionContext(robot);
			const startTime = performance.now();

			// Create a sandboxed function
			const sandboxedFunction = new Function(
				'robot',
				`
				"use strict";
				${activeCode.code}

				if (typeof update === 'function') {
					update(robot);
				}
				`
			);

			// Execute with energy cost
			if (!gameState.consumeEnergy(ENERGY_COSTS.FUNCTION_CALL)) {
				gameState.updateRobot(robot.id, {
					status: 'error',
					currentInstruction: 'Insufficient energy'
				});
				continue;
			}

			sandboxedFunction(context);

			// Track profiling
			const executionTime = performance.now() - startTime;
			const existing = profilingData.get(activeCode.id) || { calls: 0, totalTime: 0, energyUsed: 0 };
			profilingData.set(activeCode.id, {
				calls: existing.calls + 1,
				totalTime: existing.totalTime + executionTime,
				energyUsed: existing.energyUsed + ENERGY_COSTS.FUNCTION_CALL
			});

		} catch (error) {
			// Handle execution errors
			gameState.updateRobot(robot.id, {
				status: 'error',
				currentInstruction: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
}

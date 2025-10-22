import type { Robot } from '$lib/types/game';
import { gameState } from '$lib/stores/gameState.svelte';

// Energy costs
const ENERGY_COSTS = {
	MOVE: 0.1,
	PICKUP: 0.5,
	DROPOFF: 0.5,
	SCAN: 0.05
};

// Pyodide instance
let pyodide: any = null;
let pyodideReady = false;
let currentCodeHash = '';

// Initialize Python
export async function initPython() {
	if (pyodideReady) return;

	try {
		const { loadPyodide } = await import('pyodide');
		pyodide = await loadPyodide({
			indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/'
		});
		pyodideReady = true;
		console.log('Python environment initialized');
	} catch (error) {
		console.error('Failed to load Python:', error);
		throw error;
	}
}

// Helper: calculate distance
function distance(x1: number, y1: number, x2: number, y2: number): number {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Create robot API module for Python
function createRobotAPI(robot: Robot) {
	return {
		// Get robot's current position
		get_position: () => {
			const result = { x: robot.position.x, y: robot.position.y };
			return pyodide.toPy(result);
		},

		// Get what robot is carrying
		get_inventory: () => {
			// Return Python dict with proper None
			const inventoryDict = pyodide.runPython(`{"type": None, "amount": ${robot.carryAmount}}`);
			if (robot.carrying) {
				inventoryDict.set('type', robot.carrying);
			}
			return inventoryDict;
		},

		// Scan for nearby resource nodes (returns simple list of dicts)
		scan_resources: (radiusArg: any) => {
			// Handle Python keyword arguments - extract actual number
			const radius = typeof radiusArg === 'object' && radiusArg.radius !== undefined ? radiusArg.radius : radiusArg;

			if (!gameState.consumeEnergy(ENERGY_COSTS.SCAN)) {
				throw new Error('Insufficient energy');
			}

			const results = gameState.spawnedResources
				.filter(resource => {
					const dist = distance(robot.position.x, robot.position.y, resource.position.x, resource.position.y);
					return dist <= radius;
				})
				.map(resource => ({
					id: resource.id,
					x: resource.position.x,
					y: resource.position.y,
					type: resource.resourceType,
					amount: resource.amount
				}));

			return pyodide.toPy(results);
		},

		// Scan for nearby machines
		scan_machines: (radiusArg: any) => {
			// Handle Python keyword arguments - extract actual number
			const radius = typeof radiusArg === 'object' && radiusArg.radius !== undefined ? radiusArg.radius : radiusArg;

			if (!gameState.consumeEnergy(ENERGY_COSTS.SCAN)) {
				throw new Error('Insufficient energy');
			}

			const results = gameState.machines
				.filter(machine => {
					const dist = distance(robot.position.x, robot.position.y, machine.position.x, machine.position.y);
					return dist <= radius;
				})
				.map(m => ({
					id: m.id,
					x: m.position.x,
					y: m.position.y,
					type: m.type
				}));

			return pyodide.toPy(results);
		},

		// Move to coordinates
		move_to: (x: number, y: number) => {
			if (!gameState.consumeEnergy(ENERGY_COSTS.MOVE)) {
				throw new Error('Insufficient energy');
			}
			gameState.updateRobot(robot.id, {
				targetPosition: { x, y },
				status: 'moving'
			});
		},

		// Pickup resource by ID
		pickup: (resource_id: string) => {
			// Check conditions BEFORE consuming energy
			const resource = gameState.spawnedResources.find(r => r.id === resource_id);
			if (!resource) {
				// Resource no longer exists (already picked up) - not an error, just skip
				return;
			}

			if (robot.carrying) {
				// Already carrying - skip pickup
				return;
			}

			const dist = distance(robot.position.x, robot.position.y, resource.position.x, resource.position.y);
			if (dist > 20) {
				// Too far - skip without consuming energy
				return;
			}

			// Now consume energy and execute pickup
			if (!gameState.consumeEnergy(ENERGY_COSTS.PICKUP)) {
				throw new Error('Insufficient energy');
			}

			// Remove the resource from the world
			gameState.removeSpawnedResource(resource_id);

			gameState.updateRobot(robot.id, {
				carrying: resource.resourceType,
				carryAmount: resource.amount,
				status: 'idle'
			});
		},

		// Dropoff at machine by ID
		dropoff: (machine_id: string) => {
			// Check conditions BEFORE consuming energy
			if (!robot.carrying) {
				// Not carrying anything - skip dropoff
				return;
			}

			const machine = gameState.machines.find(m => m.id === machine_id);
			if (!machine) {
				throw new Error('Machine not found');
			}

			const dist = distance(robot.position.x, robot.position.y, machine.position.x, machine.position.y);
			if (dist > 25) {
				// Too far - skip without consuming energy
				return;
			}

			// Now consume energy and execute dropoff
			if (!gameState.consumeEnergy(ENERGY_COSTS.DROPOFF)) {
				throw new Error('Insufficient energy');
			}

			// Add to machine inventory
			const currentAmount = machine.inventory.get(robot.carrying) || 0;
			machine.inventory.set(robot.carrying, currentAmount + robot.carryAmount);

			// Add to player's resources
			gameState.addResource(robot.carrying, robot.carryAmount);

			gameState.updateRobot(robot.id, {
				carrying: null,
				carryAmount: 0,
				status: 'idle'
			});
		}
	};
}

// Execute Python code from .py file content
export async function executePythonCode(pythonCode: string, robot: Robot) {
	if (!pyodideReady) {
		console.warn('Python not initialized');
		return;
	}

	try {
		// Create robot API for this specific robot
		const api = createRobotAPI(robot);

		// Register robot_api as a proper Python module
		pyodide.registerJsModule('robot_api', api);

		// Hash the code to detect changes
		const codeHash = pythonCode.substring(0, 100); // Simple hash

		// Only reload the Python module if code changed
		if (codeHash !== currentCodeHash) {
			currentCodeHash = codeHash;
			// Execute the Python file to define the update function
			await pyodide.runPythonAsync(pythonCode);
		}

		// Call the update function
		await pyodide.runPythonAsync('update()');

	} catch (error: any) {
		gameState.updateRobot(robot.id, {
			status: 'error',
			currentInstruction: error.message || 'Python error'
		});
		console.error('[Python] Execution error:', error.message);
		console.error('[Python] Full error:', error);
	}
}

// Execute all robots
export async function executeAllRobots() {
	if (!pyodideReady) {
		console.warn('executeAllRobots: Python not ready');
		return;
	}

	const activeCode = gameState.activeCode;
	if (!activeCode) {
		console.warn('executeAllRobots: No active code');
		return;
	}

	for (const robot of gameState.robots) {
		if (!gameState.consumeEnergy(0.01)) {
			gameState.updateRobot(robot.id, {
				status: 'error',
				currentInstruction: 'Insufficient energy'
			});
			continue;
		}

		await executePythonCode(activeCode.code, robot);
	}
}

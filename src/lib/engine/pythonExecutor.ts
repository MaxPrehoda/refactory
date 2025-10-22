import type { Robot, ResourceNode, Machine, Position } from '$lib/types/game';
import { gameState } from '$lib/stores/gameState.svelte';
import { loadingState } from '$lib/stores/loadingState.svelte';

// Energy cost for different operations
const ENERGY_COSTS = {
	MOVE: 0.1,
	PICKUP: 0.5,
	DROPOFF: 0.5,
	FUNCTION_CALL: 0.01
};

// Pyodide instance
let pyodide: any = null;
let pyodideReady = false;

// Initialize Pyodide
export async function initPython() {
	if (pyodideReady) return;

	try {
		loadingState.setLoading(true, 'Loading Python runtime...');
		loadingState.setProgress(20);

		// @ts-ignore - Pyodide is loaded from CDN
		const { loadPyodide } = await import('pyodide');

		loadingState.setProgress(40);
		loadingState.setLoading(true, 'Initializing Python environment...');

		pyodide = await loadPyodide({
			indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/'
		});

		loadingState.setProgress(100);
		pyodideReady = true;

		loadingState.setLoading(false, '');
		console.log('Python environment initialized');
	} catch (error) {
		console.error('Failed to load Pyodide:', error);
		loadingState.setLoading(false, 'Failed to load Python');
		throw error;
	}
}

// Track profiling data
export const profilingData = new Map<string, { calls: number; totalTime: number; energyUsed: number }>();

// Helper functions to calculate distance
function distance(p1: Position, p2: Position): number {
	return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Create Python API for robot
function createRobotAPI(robot: Robot) {
	return {
		get_nearby_resources: (radius: number) => {
			const resources = gameState.resourceNodes
				.filter(node => distance(robot.position, node.position) <= radius)
				.filter(node => node.currentAmount >= 1) // Only return nodes with resources
				.map(node => ({
					id: node.id,
					position: { x: node.position.x, y: node.position.y },
					resource_type: node.resourceType,
					extraction_rate: node.extractionRate,
					current_amount: Math.floor(node.currentAmount)
				}));
			return pyodide.toPy(resources);
		},

		get_nearby_machines: (radius: number) => {
			const machines = gameState.machines
				.filter(machine => distance(robot.position, machine.position) <= radius)
				.map(m => ({
					id: m.id,
					type: m.type,
					position: { x: m.position.x, y: m.position.y },
					active: m.active
				}));
			return pyodide.toPy(machines);
		},

		move_to: (x: number, y: number) => {
			if (!gameState.consumeEnergy(ENERGY_COSTS.MOVE)) {
				throw new Error('Insufficient energy');
			}
			gameState.updateRobot(robot.id, {
				targetPosition: { x, y },
				status: 'moving'
			});
		},

		pickup: (resource_node: any) => {
			if (!gameState.consumeEnergy(ENERGY_COSTS.PICKUP)) {
				throw new Error('Insufficient energy');
			}

			// Convert Python dict to JS object if needed
			const nodeData = resource_node.toJs ? resource_node.toJs() : resource_node;
			const node = gameState.resourceNodes.find(n => n.id === nodeData.id);
			if (!node) {
				throw new Error('Resource node not found');
			}

			if (distance(robot.position, node.position) > 10) {
				throw new Error('Too far from resource node');
			}

			if (robot.carrying) {
				throw new Error('Already carrying something');
			}

			// Check if node has resources available
			if (node.currentAmount < 1) {
				throw new Error('Resource node is empty');
			}

			// Consume resource from node
			node.currentAmount = Math.max(0, node.currentAmount - 1);
			node.lastHarvested = gameState.tick;

			gameState.updateRobot(robot.id, {
				carrying: node.resourceType,
				carryAmount: 1,
				status: 'idle' // Set to idle so robot can continue with next task
			});
		},

		dropoff: (machine: any) => {
			console.log('[DROPOFF] Called with machine:', machine);

			if (!gameState.consumeEnergy(ENERGY_COSTS.DROPOFF)) {
				throw new Error('Insufficient energy');
			}

			// Convert Python dict to JS object if needed
			const machineData = machine.toJs ? machine.toJs() : machine;
			console.log('[DROPOFF] Machine data:', machineData);

			const m = gameState.machines.find(mach => mach.id === machineData.id);
			if (!m) {
				console.error('[DROPOFF] Machine not found! Looking for:', machineData.id);
				throw new Error('Machine not found');
			}

			const dist = distance(robot.position, m.position);
			console.log('[DROPOFF] Distance to machine:', dist);

			if (dist > 20) {
				throw new Error(`Too far from machine (${dist.toFixed(1)} units)`);
			}

			if (!robot.carrying) {
				throw new Error('Not carrying anything');
			}

			// Add to machine inventory
			const currentAmount = m.inventory.get(robot.carrying) || 0;
			m.inventory.set(robot.carrying, currentAmount + robot.carryAmount);

			// Add to player's global resources
			console.log('[DROPOFF] Adding to resources:', robot.carrying, robot.carryAmount);
			gameState.addResource(robot.carrying, robot.carryAmount);

			gameState.updateRobot(robot.id, {
				carrying: null,
				carryAmount: 0,
				status: 'idle'
			});

			console.log('[DROPOFF] Dropoff complete!');
		},

		get_inventory: () => {
			// Create Python dict with proper None handling
			const pyDict = pyodide.runPython(`{"type": None, "amount": 0}`);
			pyDict.set('type', robot.carrying === null ? pyodide.globals.get('None') : robot.carrying);
			pyDict.set('amount', robot.carryAmount);
			return pyDict;
		},

		get_position: () => {
			return pyodide.toPy({ x: robot.position.x, y: robot.position.y });
		},

		get_status: () => robot.status,

		get_energy: () => robot.energy
	};
}

// Execute player's Python code
export async function executePlayerCode() {
	if (!pyodideReady) {
		console.warn('Python not initialized yet');
		return;
	}

	const activeCode = gameState.activeCode;
	if (!activeCode) return;

	// Execute code for each robot
	for (const robot of gameState.robots) {
		try {
			const startTime = performance.now();

			// Create robot API
			const robotAPI = createRobotAPI(robot);

			// Set up the Python namespace - pass JS object directly as proxy
			pyodide.globals.set('robot', robotAPI);

			// Consume energy for function call
			if (!gameState.consumeEnergy(ENERGY_COSTS.FUNCTION_CALL)) {
				gameState.updateRobot(robot.id, {
					status: 'error',
					currentInstruction: 'Insufficient energy'
				});
				continue;
			}

			// Execute the Python code
			await pyodide.runPythonAsync(activeCode.code);

			// Track profiling
			const executionTime = performance.now() - startTime;
			const existing = profilingData.get(activeCode.id) || { calls: 0, totalTime: 0, energyUsed: 0 };
			profilingData.set(activeCode.id, {
				calls: existing.calls + 1,
				totalTime: existing.totalTime + executionTime,
				energyUsed: existing.energyUsed + ENERGY_COSTS.FUNCTION_CALL
			});

		} catch (error: any) {
			// Handle execution errors
			const errorMsg = error.message || 'Unknown error';
			gameState.updateRobot(robot.id, {
				status: 'error',
				currentInstruction: errorMsg
			});
			console.error('Python execution error:', errorMsg);
		}
	}
}

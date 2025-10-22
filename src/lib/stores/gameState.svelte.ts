import type { GameState, Robot, Machine, Resource, PlayerCode, SpawnedResource, Department, Quota, QuotaHistoryEntry } from '$lib/types/game';

// Quota progression - defines the sequence of objectives
const QUOTA_PROGRESSION: Quota[] = [
	{
		resourceId: 'iron',
		targetAmount: 50,
		timeLimit: 9000, // 5 minutes at 30 TPS
		reward: {
			type: 'unlock_robot',
			description: 'Unlock a second robot to help automate!'
		}
	},
	{
		resourceId: 'copper',
		targetAmount: 50,
		timeLimit: 9000, // 5 minutes
		reward: {
			type: 'unlock_machine',
			description: 'Energy regeneration increased!'
		}
	},
	{
		resourceId: 'iron',
		targetAmount: 75,
		timeLimit: 7200, // 4 minutes
		reward: {
			type: 'unlock_robot',
			description: 'Unlock a third robot!'
		}
	},
	{
		resourceId: 'copper',
		targetAmount: 100,
		timeLimit: 10800, // 6 minutes
		reward: {
			type: 'next_level',
			description: 'Level up! Max energy increased!'
		}
	},
	{
		resourceId: 'iron',
		targetAmount: 150,
		timeLimit: 9000, // 5 minutes
		reward: {
			type: 'unlock_robot',
			description: 'Unlock a fourth robot!'
		}
	}
];

// Initial game state
const createInitialState = (): GameState => ({
	tick: 0,
	energy: 1000,
	maxEnergy: 1000,
	energyRegenRate: 0.8,
	level: 1,
	experience: 0,
	currentQuota: QUOTA_PROGRESSION[0],
	quotaStartTick: 0,
	quotaLevel: 1,
	quotaHistory: [],
	resources: new Map<string, Resource>([
		['iron', { id: 'iron', name: 'Iron Ore', amount: 0, icon: '⚙️' }],
		['copper', { id: 'copper', name: 'Copper Ore', amount: 0, icon: '🟠' }],
		['circuit', { id: 'circuit', name: 'Circuit Board', amount: 0, icon: '💾' }]
	]),
	robots: [
		{
			id: 'robot-1',
			position: { x: 100, y: 100 },
			targetPosition: null,
			speed: 2,
			carrying: null,
			carryAmount: 0,
			status: 'idle',
			currentInstruction: null,
			energy: 100
		}
	],
	machines: [
		{
			id: 'storage-1',
			type: 'storage',
			position: { x: 400, y: 100 },
			recipe: null,
			progress: 0,
			inventory: new Map(),
			outputInventory: new Map(),
			active: true
		}
	],
	conveyorBelts: [],
	spawnedResources: [],
	departments: [],
	playerCode: [
		{
			id: 'code-1',
			name: 'Main Controller',
			code: `# Welcome to ReFactory!
# Your first robot is ready. Let's automate resource gathering!
import robot_api

def update():
    """Called every game tick"""
    # Get robot's current state
    position = robot_api.get_position()
    inventory = robot_api.get_inventory()

    # Strategy: Pick up iron, deliver to storage, repeat
    # (This works but is VERY inefficient - can you improve it?)

    # If carrying something, find storage and deliver
    if inventory["type"] is not None:
        # Find nearby storage (within 500 units - way too far!)
        machines = robot_api.scan_machines(radius=500)

        if len(machines) > 0:
            storage = machines[0]

            # Calculate distance (doing this every tick is wasteful!)
            dx = storage["x"] - position["x"]
            dy = storage["y"] - position["y"]
            distance = (dx ** 2 + dy ** 2) ** 0.5

            if distance < 20:
                # Drop off the resource
                robot_api.dropoff(storage["id"])
            else:
                # Move toward storage
                robot_api.move_to(storage["x"], storage["y"])

    # If not carrying anything, find resources
    else:
        # Scan for resources (very large radius = slow!)
        resources = robot_api.scan_resources(radius=300)

        if len(resources) > 0:
            # Always take the first one (not optimal!)
            resource = resources[0]

            # Calculate distance
            dx = resource["x"] - position["x"]
            dy = resource["y"] - position["y"]
            distance = (dx ** 2 + dy ** 2) ** 0.5

            if distance < 15:
                # Pick up the resource
                robot_api.pickup(resource["id"])
            else:
                # Move toward resource
                robot_api.move_to(resource["x"], resource["y"])
`,
			lastModified: Date.now(),
			executionCount: 0,
			averageExecutionTime: 0
		}
	],
	activeCodeId: 'code-1',
	isPaused: false,
	gameSpeed: 1
});

// Create reactive game state
class GameStateStore {
	private state = $state<GameState>(createInitialState());

	get current(): GameState {
		return this.state;
	}

	get energy(): number {
		return this.state.energy;
	}

	get maxEnergy(): number {
		return this.state.maxEnergy;
	}

	get robots(): Robot[] {
		return this.state.robots;
	}

	get machines(): Machine[] {
		return this.state.machines;
	}

	get resources(): Map<string, Resource> {
		return this.state.resources;
	}

	get spawnedResources(): SpawnedResource[] {
		return this.state.spawnedResources;
	}

	get activeCode(): PlayerCode | null {
		return this.state.playerCode.find(c => c.id === this.state.activeCodeId) || null;
	}

	get isPaused(): boolean {
		return this.state.isPaused;
	}

	get tick(): number {
		return this.state.tick;
	}

	get currentQuota(): Quota | null {
		return this.state.currentQuota;
	}

	get quotaProgress(): number {
		if (!this.state.currentQuota) return 0;
		const resource = this.state.resources.get(this.state.currentQuota.resourceId);
		if (!resource) return 0;
		return Math.min(1, resource.amount / this.state.currentQuota.targetAmount);
	}

	get quotaTimeRemaining(): number {
		if (!this.state.currentQuota) return 0;
		const elapsed = this.state.tick - this.state.quotaStartTick;
		return Math.max(0, this.state.currentQuota.timeLimit - elapsed);
	}

	// Actions
	incrementTick() {
		this.state.tick++;
		// Regenerate energy
		if (this.state.energy < this.state.maxEnergy) {
			this.state.energy = Math.min(
				this.state.maxEnergy,
				this.state.energy + this.state.energyRegenRate
			);
		}
	}

	consumeEnergy(amount: number): boolean {
		if (this.state.energy >= amount) {
			this.state.energy -= amount;
			return true;
		}
		return false;
	}

	addResource(resourceId: string, amount: number) {
		const resource = this.state.resources.get(resourceId);
		if (resource) {
			// Update the resource object immutably
			const updatedResource = { ...resource, amount: resource.amount + amount };
			// Create new Map with updated resource
			this.state.resources = new Map(this.state.resources.set(resourceId, updatedResource));
		}
	}

	removeResource(resourceId: string, amount: number): boolean {
		const resource = this.state.resources.get(resourceId);
		if (resource && resource.amount >= amount) {
			resource.amount -= amount;
			return true;
		}
		return false;
	}

	updateRobot(robotId: string, updates: Partial<Robot>) {
		const robot = this.state.robots.find(r => r.id === robotId);
		if (robot) {
			Object.assign(robot, updates);
		}
	}

	updateCode(codeId: string, code: string) {
		const playerCode = this.state.playerCode.find(c => c.id === codeId);
		if (playerCode) {
			playerCode.code = code;
			playerCode.lastModified = Date.now();
		}
	}

	togglePause() {
		this.state.isPaused = !this.state.isPaused;
	}

	setGameSpeed(speed: number) {
		this.state.gameSpeed = Math.max(0.1, Math.min(5, speed));
	}

	checkQuotaCompletion(): boolean {
		if (!this.state.currentQuota) return false;

		const resource = this.state.resources.get(this.state.currentQuota.resourceId);
		if (!resource) return false;

		// Check if quota is met
		if (resource.amount >= this.state.currentQuota.targetAmount) {
			this.completeQuota();
			return true;
		}

		// Check if time ran out
		if (this.quotaTimeRemaining <= 0) {
			this.failQuota();
			return false;
		}

		return false;
	}

	completeQuota() {
		if (!this.state.currentQuota) return;

		const quota = this.state.currentQuota;
		const resource = this.state.resources.get(quota.resourceId);
		const timeUsed = this.state.tick - this.state.quotaStartTick;

		// Record quota completion in history
		this.state.quotaHistory.push({
			level: this.state.quotaLevel,
			success: true,
			resourceId: quota.resourceId,
			targetAmount: quota.targetAmount,
			actualAmount: resource?.amount || 0,
			timeUsed,
			rewardDescription: quota.reward.description
		});

		// Apply reward
		if (quota.reward.type === 'unlock_robot') {
			const newRobot: Robot = {
				id: `robot-${this.state.robots.length + 1}`,
				position: { x: 100 + this.state.robots.length * 50, y: 100 },
				targetPosition: null,
				speed: 2,
				carrying: null,
				carryAmount: 0,
				status: 'idle',
				currentInstruction: null,
				energy: 100
			};
			this.state.robots.push(newRobot);
		} else if (quota.reward.type === 'unlock_machine') {
			// Increase energy regen
			this.state.energyRegenRate += 0.5;
		} else if (quota.reward.type === 'next_level') {
			// Level up - increase max energy
			this.state.level++;
			this.state.maxEnergy += 500;
		}

		// Load next quota
		this.state.quotaLevel++;
		const nextQuotaIndex = this.state.quotaLevel - 1;

		if (nextQuotaIndex < QUOTA_PROGRESSION.length) {
			this.state.currentQuota = QUOTA_PROGRESSION[nextQuotaIndex];
			this.state.quotaStartTick = this.state.tick;
		} else {
			// Player has completed all quotas!
			this.state.currentQuota = null;
		}
	}

	failQuota() {
		if (!this.state.currentQuota) return;

		const quota = this.state.currentQuota;
		const resource = this.state.resources.get(quota.resourceId);
		const timeUsed = this.state.tick - this.state.quotaStartTick;

		// Record quota failure in history
		this.state.quotaHistory.push({
			level: this.state.quotaLevel,
			success: false,
			resourceId: quota.resourceId,
			targetAmount: quota.targetAmount,
			actualAmount: resource?.amount || 0,
			timeUsed
		});

		// Reset the resource counter for a fresh start
		if (resource) {
			const updatedResource = { ...resource, amount: 0 };
			this.state.resources = new Map(this.state.resources.set(quota.resourceId, updatedResource));
		}

		// Retry the same quota - reset timer
		this.state.quotaStartTick = this.state.tick;
	}

	spawnResource(resourceType: string, position: { x: number; y: number }, amount: number = 1) {
		const resource: SpawnedResource = {
			id: `resource-${this.state.tick}-${Math.random().toString(36).substr(2, 9)}`,
			position,
			resourceType,
			amount
		};
		this.state.spawnedResources.push(resource);
	}

	removeSpawnedResource(resourceId: string) {
		const index = this.state.spawnedResources.findIndex(r => r.id === resourceId);
		if (index !== -1) {
			this.state.spawnedResources.splice(index, 1);
		}
	}

	increaseEnergyRegen(amount: number) {
		this.state.energyRegenRate += amount;
	}

	increaseMaxEnergy(amount: number) {
		this.state.maxEnergy += amount;
		// Also add the energy immediately so player gets the benefit right away
		this.state.energy += amount;
	}

	reset() {
		this.state = createInitialState();
	}

	// Save/Load
	saveToLocalStorage() {
		try {
			const saveData = {
				...this.state,
				resources: Array.from(this.state.resources.entries()),
				timestamp: Date.now()
			};
			localStorage.setItem('refactory-save', JSON.stringify(saveData));
		} catch (e) {
			console.error('Failed to save game:', e);
		}
	}

	loadFromLocalStorage(): boolean {
		try {
			const saved = localStorage.getItem('refactory-save');
			if (saved) {
				const data = JSON.parse(saved);
				this.state = {
					...data,
					resources: new Map(data.resources)
				};
				return true;
			}
		} catch (e) {
			console.error('Failed to load game:', e);
		}
		return false;
	}
}

export const gameState = new GameStateStore();

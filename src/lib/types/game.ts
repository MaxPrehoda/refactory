// Core game types
export interface Position {
	x: number;
	y: number;
}

export interface Resource {
	id: string;
	name: string;
	amount: number;
	icon: string;
}

export interface SpawnedResource {
	id: string;
	position: Position;
	resourceType: string;
	amount: number;
}

export interface Robot {
	id: string;
	position: Position;
	targetPosition: Position | null;
	speed: number;
	carrying: string | null;
	carryAmount: number;
	status: 'idle' | 'moving' | 'working' | 'error';
	currentInstruction: string | null;
	energy: number;
}

export interface Machine {
	id: string;
	type: 'assembler' | 'extractor' | 'storage' | 'processor';
	position: Position;
	recipe: Recipe | null;
	progress: number;
	inventory: Map<string, number>;
	outputInventory: Map<string, number>;
	active: boolean;
}

export interface Recipe {
	id: string;
	name: string;
	inputs: { resourceId: string; amount: number }[];
	outputs: { resourceId: string; amount: number }[];
	productionTime: number;
	energyCost: number;
}

export interface ConveyorBelt {
	id: string;
	start: Position;
	end: Position;
	items: { resourceId: string; progress: number }[];
	speed: number;
}

export interface Department {
	id: string;
	name: string;
	unlocked: boolean;
	recipes: Recipe[];
	machines: Machine[];
	requiredLevel: number;
}

export interface PlayerCode {
	id: string;
	name: string;
	code: string;
	lastModified: number;
	executionCount: number;
	averageExecutionTime: number;
}

export interface Quota {
	resourceId: string;
	targetAmount: number;
	timeLimit: number; // in ticks
	reward: {
		type: 'unlock_robot' | 'unlock_machine' | 'next_level';
		description: string;
	};
}

export interface QuotaHistoryEntry {
	level: number;
	success: boolean;
	resourceId: string;
	targetAmount: number;
	actualAmount: number;
	timeUsed: number;
	rewardDescription?: string;
}

export interface GameState {
	tick: number;
	energy: number;
	maxEnergy: number;
	energyRegenRate: number;
	level: number;
	experience: number;
	resources: Map<string, Resource>;
	robots: Robot[];
	machines: Machine[];
	conveyorBelts: ConveyorBelt[];
	spawnedResources: SpawnedResource[];
	departments: Department[];
	playerCode: PlayerCode[];
	activeCodeId: string | null;
	isPaused: boolean;
	gameSpeed: number;
	currentQuota: Quota | null;
	quotaStartTick: number;
	quotaLevel: number;
	quotaHistory: QuotaHistoryEntry[];
}

export interface CodeExecutionContext {
	robot: Robot;
	getNearbyResources: (radius: number) => SpawnedResource[];
	getNearbyMachines: (radius: number) => Machine[];
	moveTo: (position: Position) => void;
	pickup: (resource: SpawnedResource) => void;
	dropoff: (machine: Machine) => void;
	wait: (ticks: number) => void;
	getInventory: () => { type: string | null; amount: number };
}

export interface ProfilingData {
	functionName: string;
	calls: number;
	totalTime: number;
	averageTime: number;
	energyUsed: number;
}

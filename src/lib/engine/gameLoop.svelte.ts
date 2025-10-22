import { gameState } from '$lib/stores/gameState.svelte';
import { loadingState } from '$lib/stores/loadingState.svelte';
import { executeAllRobots, initPython } from './pythonRunner';
import { updateRobots } from './robotController';
import { updateMachines } from './machineController';

class GameLoop {
	private animationFrameId: number | null = null;
	private lastTick = 0;
	private tickRate = 1000 / 30; // 30 ticks per second
	private accumulatedTime = 0;

	async start() {
		if (this.animationFrameId !== null) return;

		// Initialize Python environment
		loadingState.setLoading(true, 'Initializing Python environment...');
		loadingState.setProgress(30);

		await initPython();

		loadingState.setProgress(100);
		loadingState.setLoading(false);

		// Spawn initial resources near the starting position to help players get started
		this.spawnInitialResources();

		this.lastTick = performance.now();
		let isProcessing = false;

		const loop = async (currentTime: number) => {
			if (!gameState.isPaused && !isProcessing) {
				const deltaTime = currentTime - this.lastTick;
				this.lastTick = currentTime;

				this.accumulatedTime += deltaTime * gameState.current.gameSpeed;

				// Fixed timestep updates
				if (this.accumulatedTime >= this.tickRate) {
					isProcessing = true;
					await this.tick();
					this.accumulatedTime -= this.tickRate;
					isProcessing = false;
				}
			}

			this.animationFrameId = requestAnimationFrame(loop);
		};

		this.animationFrameId = requestAnimationFrame(loop);
	}

	stop() {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	private async tick() {
		// Increment game tick
		gameState.incrementTick();

		// Spawn resources randomly
		this.spawnResources();

		// Execute player code for robots
		await executeAllRobots();

		// Update robot physics and movement
		updateRobots();

		// Update machine production
		updateMachines();

		// Check quota progress
		gameState.checkQuotaCompletion();

		// Auto-save every 300 ticks (10 seconds at 30 TPS)
		if (gameState.tick % 300 === 0) {
			gameState.saveToLocalStorage();
		}
	}

	private spawnInitialResources() {
		// Spawn a few resources near the starting position (100, 100)
		// so robots can immediately start working
		for (let i = 0; i < 3; i++) {
			const x = 150 + Math.random() * 200; // Within 200-350
			const y = 150 + Math.random() * 200; // Within 200-350
			gameState.spawnResource('iron', { x, y }, 1);
		}
		for (let i = 0; i < 2; i++) {
			const x = 150 + Math.random() * 200;
			const y = 150 + Math.random() * 200;
			gameState.spawnResource('copper', { x, y }, 1);
		}
	}

	private spawnResources() {
		// Spawn resources randomly across the factory floor
		// Much larger spawn area for zoom functionality
		// Spawn iron every 60 ticks (2 seconds)
		if (gameState.tick % 60 === 0) {
			const x = 100 + Math.random() * 1200; // Random x between 100-1300
			const y = 100 + Math.random() * 900; // Random y between 100-1000
			gameState.spawnResource('iron', { x, y }, 1);
		}

		// Spawn copper every 90 ticks (3 seconds)
		if (gameState.tick % 90 === 0) {
			const x = 100 + Math.random() * 1200;
			const y = 100 + Math.random() * 900;
			gameState.spawnResource('copper', { x, y }, 1);
		}
	}

	reset() {
		this.stop();
		gameState.reset();
		this.start();
	}
}

export const gameLoop = new GameLoop();

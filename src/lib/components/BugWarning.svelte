<script lang="ts">
	import { gameState } from '$lib/stores/gameState.svelte';
	import { onMount } from 'svelte';

	interface BugDetection {
		type: 'storage_unreachable' | 'resource_unreachable' | 'infinite_loop';
		message: string;
		suggestion: string;
		robotId: string;
	}

	let detectedBug = $state<BugDetection | null>(null);
	let dismissed = $state(false);
	let lastCheckTick = 0;
	let initialCodeHash = '';

	// Track robot states for bug detection
	let robotStates = new Map<string, {
		lastPosition: { x: number; y: number };
		stuckTicks: number;
		carrying: string | null;
		lastCarryingChange: number;
	}>();

	onMount(() => {
		// Store hash of initial code - only show warnings if code has been modified
		const activeCode = gameState.activeCode;
		if (activeCode) {
			initialCodeHash = activeCode.code.substring(0, 200);
		}
	});

	$effect(() => {
		const currentTick = gameState.tick;

		// Only check every 60 ticks (2 seconds) to reduce overhead
		if (currentTick - lastCheckTick < 60 || dismissed) {
			return;
		}

		// Only detect bugs if user has modified the code
		const activeCode = gameState.activeCode;
		if (!activeCode || activeCode.code.substring(0, 200) === initialCodeHash) {
			return;
		}

		lastCheckTick = currentTick;
		detectBugs();
	});

	function detectBugs() {
		for (const robot of gameState.robots) {
			// Initialize tracking for new robots
			if (!robotStates.has(robot.id)) {
				robotStates.set(robot.id, {
					lastPosition: { ...robot.position },
					stuckTicks: 0,
					carrying: robot.carrying,
					lastCarryingChange: gameState.tick
				});
				continue;
			}

			const state = robotStates.get(robot.id)!;

			// Check if robot is stuck in one place
			const movedDistance = Math.sqrt(
				Math.pow(robot.position.x - state.lastPosition.x, 2) +
				Math.pow(robot.position.y - state.lastPosition.y, 2)
			);

			if (movedDistance < 5) {
				state.stuckTicks++;
			} else {
				state.stuckTicks = 0;
				state.lastPosition = { ...robot.position };
			}

			// Track when robot changes carrying state
			if (robot.carrying !== state.carrying) {
				state.lastCarryingChange = gameState.tick;
				state.carrying = robot.carrying;
			}

			// Bug Detection: Robot stuck with resource for too long (can't reach storage)
			if (robot.carrying && state.stuckTicks > 300) { // Stuck for 10 seconds
				const storage = gameState.machines.find(m => m.type === 'storage');
				if (storage) {
					const distToStorage = Math.sqrt(
						Math.pow(robot.position.x - storage.position.x, 2) +
						Math.pow(robot.position.y - storage.position.y, 2)
					);

					if (distToStorage > 500) {
						detectedBug = {
							type: 'storage_unreachable',
							message: '⚠️ Robot Bug Detected!',
							suggestion: `Your robot (${robot.id}) is ${distToStorage.toFixed(0)} units away from storage but trying to deliver resources. The storage location might be out of reach of your code's scan radius or movement logic.`,
							robotId: robot.id
						};
						return;
					}
				}
			}

			// Bug Detection: Robot stuck without carrying anything for very long
			if (!robot.carrying && state.stuckTicks > 450) { // Stuck for 15 seconds
				const nearbyResources = gameState.spawnedResources.filter(r => {
					const dist = Math.sqrt(
						Math.pow(robot.position.x - r.position.x, 2) +
						Math.pow(robot.position.y - r.position.y, 2)
					);
					return dist < 300;
				});

				if (nearbyResources.length === 0) {
					detectedBug = {
						type: 'resource_unreachable',
						message: '⚠️ Robot Bug Detected!',
						suggestion: `Your robot (${robot.id}) appears stuck with no resources nearby. Your scan radius might be too small, or the robot moved too far from resource spawn areas.`,
						robotId: robot.id
					};
					return;
				}
			}

			// Bug Detection: Robot not making progress (carrying same thing for too long)
			if (robot.carrying && (gameState.tick - state.lastCarryingChange) > 900) { // 30 seconds
				detectedBug = {
					type: 'infinite_loop',
					message: '⚠️ Infinite Loop Detected!',
					suggestion: `Your robot (${robot.id}) has been carrying ${robot.carrying} for 30+ seconds without delivering it. Check your dropoff logic - you might be moving away from storage or have an unreachable target.`,
					robotId: robot.id
				};
				return;
			}
		}
	}

	function dismissWarning() {
		dismissed = true;
		detectedBug = null;
	}

	function focusRobot() {
		// This would trigger camera focus on the robot
		// For now, just dismiss
		dismissWarning();
	}
</script>

{#if detectedBug && !dismissed}
	<div class="bug-warning-overlay">
		<div class="bug-warning-card">
			<div class="bug-header">
				<div class="bug-icon">🐛</div>
				<h3>{detectedBug.message}</h3>
			</div>

			<div class="bug-content">
				<div class="bug-type">
					{#if detectedBug.type === 'storage_unreachable'}
						<span class="badge badge-error">Storage Unreachable</span>
					{:else if detectedBug.type === 'resource_unreachable'}
						<span class="badge badge-warning">No Resources Found</span>
					{:else if detectedBug.type === 'infinite_loop'}
						<span class="badge badge-error">Infinite Loop</span>
					{/if}
				</div>

				<p class="bug-description">
					{detectedBug.suggestion}
				</p>

				<div class="bug-suggestions">
					<h4>💡 Suggestions to fix:</h4>
					<ul>
						{#if detectedBug.type === 'storage_unreachable'}
							<li>Increase your machine scan radius to at least 600 units</li>
							<li>Cache the storage location instead of scanning every tick</li>
							<li>Check if your movement logic is sending the robot in circles</li>
						{:else if detectedBug.type === 'resource_unreachable'}
							<li>Increase your resource scan radius (try 300-500 units)</li>
							<li>Add logic to move toward the center of the map periodically</li>
							<li>Check if your movement code has bugs</li>
						{:else if detectedBug.type === 'infinite_loop'}
							<li>Verify your dropoff distance check matches the actual distance to storage</li>
							<li>Make sure you're calling dropoff() when close enough</li>
							<li>Check if your code has conflicting movement commands</li>
						{/if}
					</ul>
				</div>
			</div>

			<div class="bug-footer">
				<button class="btn-secondary" onclick={focusRobot}>
					Focus on Robot
				</button>
				<button class="btn-primary" onclick={dismissWarning}>
					I'll Fix It
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.bug-warning-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		animation: fadeIn 0.3s ease-out;
		backdrop-filter: blur(4px);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.bug-warning-card {
		background: #1e1e1e;
		border: 3px solid #ff4444;
		border-radius: 12px;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(255, 68, 68, 0.4);
		animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	@keyframes slideIn {
		from {
			transform: scale(0.8) translateY(-20px);
			opacity: 0;
		}
		to {
			transform: scale(1) translateY(0);
			opacity: 1;
		}
	}

	.bug-header {
		background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
		padding: 24px;
		border-bottom: 2px solid #ff4444;
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.bug-icon {
		font-size: 48px;
		animation: wiggle 0.5s ease-in-out infinite;
	}

	@keyframes wiggle {
		0%, 100% { transform: rotate(0deg); }
		25% { transform: rotate(-10deg); }
		75% { transform: rotate(10deg); }
	}

	.bug-header h3 {
		margin: 0;
		font-size: 24px;
		color: #ff4444;
		text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
	}

	.bug-content {
		padding: 24px;
		color: #ddd;
	}

	.bug-type {
		margin-bottom: 16px;
	}

	.badge {
		display: inline-block;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.badge-error {
		background: #ff4444;
		color: #fff;
	}

	.badge-warning {
		background: #ffaa00;
		color: #000;
	}

	.bug-description {
		margin: 16px 0;
		font-size: 15px;
		line-height: 1.6;
		color: #fff;
		background: #2a2a2a;
		padding: 16px;
		border-left: 4px solid #ff4444;
		border-radius: 4px;
	}

	.bug-suggestions {
		margin-top: 24px;
	}

	.bug-suggestions h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		color: #4a90e2;
	}

	.bug-suggestions ul {
		margin: 0;
		padding-left: 20px;
		list-style: none;
	}

	.bug-suggestions li {
		margin-bottom: 10px;
		padding-left: 24px;
		position: relative;
		line-height: 1.5;
		color: #ccc;
	}

	.bug-suggestions li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: #4a90e2;
		font-weight: bold;
	}

	.bug-footer {
		padding: 20px 24px;
		border-top: 1px solid #444;
		background: #1a1a1a;
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn-primary,
	.btn-secondary {
		padding: 12px 24px;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #ff4444;
		color: #fff;
	}

	.btn-primary:hover {
		background: #ff3333;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
	}

	.btn-secondary {
		background: #2a2a2a;
		color: #fff;
		border: 1px solid #444;
	}

	.btn-secondary:hover {
		background: #333;
		border-color: #4a90e2;
	}

	.bug-warning-card::-webkit-scrollbar {
		width: 8px;
	}

	.bug-warning-card::-webkit-scrollbar-track {
		background: #1a1a1a;
	}

	.bug-warning-card::-webkit-scrollbar-thumb {
		background: #444;
		border-radius: 4px;
	}

	.bug-warning-card::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>

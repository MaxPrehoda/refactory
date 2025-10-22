<script lang="ts">
	import { gameState } from '$lib/stores/gameState.svelte';

	let energyPercent = $derived((gameState.energy / gameState.maxEnergy) * 100);
	let energyColor = $derived(
		energyPercent > 50 ? '#44ff44' : energyPercent > 25 ? '#ffaa00' : '#ff4444'
	);
</script>

<div class="game-hud">
	<div class="hud-section">
		<h3>Resources</h3>
		<div class="resources-list">
			{#each Array.from(gameState.resources.values()) as resource}
				<div class="resource-item">
					<span class="resource-icon">{resource.icon}</span>
					<span class="resource-name">{resource.name}</span>
					<span class="resource-amount">{resource.amount.toFixed(0)}</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="hud-section">
		<h3>Energy</h3>
		<div class="energy-bar-container">
			<div class="energy-bar" style="width: {energyPercent}%; background-color: {energyColor}"></div>
			<span class="energy-text">{gameState.energy.toFixed(0)} / {gameState.maxEnergy}</span>
		</div>
		<div class="energy-info">
			<span>Regen: +{gameState.energyRegenRate}/tick</span>
		</div>
	</div>

	<div class="hud-section">
		<h3>Factory Status</h3>
		<div class="stats-grid">
			<div class="stat">
				<span class="stat-label">Robots:</span>
				<span class="stat-value">{gameState.robots.length}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Active:</span>
				<span class="stat-value">{gameState.robots.filter(r => r.status !== 'idle' && r.status !== 'error').length}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Machines:</span>
				<span class="stat-value">{gameState.machines.length}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Tick:</span>
				<span class="stat-value">{gameState.tick}</span>
			</div>
		</div>
	</div>

	<div class="hud-section">
		<h3>Robots</h3>
		<div class="robots-list">
			{#each gameState.robots as robot}
				<div class="robot-item" class:error={robot.status === 'error'}>
					<div class="robot-header">
						<span class="robot-id">{robot.id}</span>
						<span class="robot-status status-{robot.status}">{robot.status}</span>
					</div>
					{#if robot.status === 'error' && robot.currentInstruction}
						<div class="robot-error">{robot.currentInstruction}</div>
					{/if}
					{#if robot.carrying}
						<div class="robot-carrying">
							Carrying: {robot.carrying} ({robot.carryAmount})
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.game-hud {
		background: #2a2a2a;
		border: 2px solid #444;
		border-radius: 4px;
		padding: 16px;
		color: #fff;
		display: flex;
		flex-direction: column;
		gap: 16px;
		height: 100%;
		overflow-y: auto;
	}

	.hud-section {
		border-bottom: 1px solid #444;
		padding-bottom: 12px;
	}

	.hud-section:last-child {
		border-bottom: none;
	}

	.hud-section h3 {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: #888;
		text-transform: uppercase;
		font-weight: 600;
	}

	.resources-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.resource-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px;
		background: #1e1e1e;
		border-radius: 3px;
	}

	.resource-icon {
		font-size: 18px;
	}

	.resource-name {
		flex: 1;
		font-size: 12px;
	}

	.resource-amount {
		font-weight: 600;
		color: #44ff44;
		font-size: 12px;
	}

	.energy-bar-container {
		position: relative;
		height: 24px;
		background: #1e1e1e;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 4px;
	}

	.energy-bar {
		height: 100%;
		transition: width 0.3s, background-color 0.3s;
	}

	.energy-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 12px;
		font-weight: 600;
		color: #fff;
		text-shadow: 0 0 4px #000;
	}

	.energy-info {
		font-size: 11px;
		color: #888;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.stat {
		display: flex;
		justify-content: space-between;
		padding: 4px 8px;
		background: #1e1e1e;
		border-radius: 3px;
		font-size: 12px;
	}

	.stat-label {
		color: #888;
	}

	.stat-value {
		font-weight: 600;
		color: #fff;
	}

	.robots-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.robot-item {
		padding: 8px;
		background: #1e1e1e;
		border-radius: 3px;
		border-left: 3px solid #4444ff;
	}

	.robot-item.error {
		border-left-color: #ff4444;
	}

	.robot-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.robot-id {
		font-size: 11px;
		font-weight: 600;
	}

	.robot-status {
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 2px;
		text-transform: uppercase;
	}

	.status-idle {
		background: #666;
		color: #fff;
	}

	.status-moving {
		background: #4444ff;
		color: #fff;
	}

	.status-working {
		background: #44ff44;
		color: #000;
	}

	.status-error {
		background: #ff4444;
		color: #fff;
	}

	.robot-error {
		font-size: 11px;
		color: #ff8888;
		margin-top: 4px;
	}

	.robot-carrying {
		font-size: 11px;
		color: #ffaa00;
		margin-top: 4px;
	}
</style>

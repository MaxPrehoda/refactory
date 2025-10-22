<script lang="ts">
	import { gameState } from '$lib/stores/gameState.svelte';

	// Format time remaining as MM:SS
	function formatTime(ticks: number): string {
		const seconds = Math.floor(ticks / 30);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	// Get resource info
	function getResourceInfo(resourceId: string) {
		return gameState.resources.get(resourceId);
	}
</script>

{#if gameState.currentQuota}
	<div class="quota-display">
		<div class="quota-header">
			<h3>🎯 Current Objective</h3>
			<div class="time-remaining" class:warning={gameState.quotaTimeRemaining < 1800}>
				⏱️ {formatTime(gameState.quotaTimeRemaining)}
			</div>
		</div>

		<div class="quota-content">
			{#if gameState.currentQuota}
				{@const resource = getResourceInfo(gameState.currentQuota.resourceId)}
				{#if resource}
					<div class="quota-goal">
						<span class="resource-icon">{resource.icon}</span>
						<span class="resource-text">
							Collect <strong>{gameState.currentQuota.targetAmount}</strong> {resource.name}
						</span>
					</div>

					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: {gameState.quotaProgress * 100}%"
						></div>
						<div class="progress-text">
							{resource.amount} / {gameState.currentQuota.targetAmount}
						</div>
					</div>
				{/if}

				<div class="quota-reward">
					<span class="reward-label">Reward:</span>
					<span class="reward-text">{gameState.currentQuota.reward.description}</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.quota-display {
		background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
		border: 2px solid #4a9eff;
		border-radius: 8px;
		padding: 16px;
		box-shadow: 0 4px 12px rgba(74, 158, 255, 0.2);
	}

	.quota-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid #444;
	}

	.quota-header h3 {
		margin: 0;
		color: #4a9eff;
		font-size: 16px;
		font-weight: 600;
	}

	.time-remaining {
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 18px;
		font-weight: bold;
		color: #4ade80;
		padding: 4px 12px;
		background: rgba(74, 222, 128, 0.1);
		border-radius: 4px;
	}

	.time-remaining.warning {
		color: #fb923c;
		background: rgba(251, 146, 60, 0.1);
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.quota-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.quota-goal {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: #d4d4d4;
	}

	.resource-icon {
		font-size: 24px;
	}

	.resource-text strong {
		color: #4a9eff;
		font-weight: 600;
	}

	.progress-bar {
		position: relative;
		height: 32px;
		background: #1a1a1a;
		border: 1px solid #444;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		position: absolute;
		height: 100%;
		background: linear-gradient(90deg, #4a9eff 0%, #60a5fa 100%);
		transition: width 0.3s ease;
	}

	.progress-text {
		position: absolute;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-weight: bold;
		font-size: 14px;
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.quota-reward {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: rgba(74, 158, 255, 0.1);
		border-radius: 4px;
		font-size: 13px;
	}

	.reward-label {
		color: #888;
		font-weight: 600;
	}

	.reward-text {
		color: #4ade80;
		font-weight: 500;
	}
</style>

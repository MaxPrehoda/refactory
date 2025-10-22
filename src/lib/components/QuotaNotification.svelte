<script lang="ts">
	import { gameState } from '$lib/stores/gameState.svelte';

	// We'll get the reward description from the last history entry instead

	let lastQuotaLevel = $state(0);
	let showNotification = $state(false);
	let notificationType = $state<'success' | 'failure'>('success');
	let lastHistoryEntry = $state<any>(null);

	// Watch for quota level changes
	$effect(() => {
		const currentLevel = gameState.current.quotaLevel;
		const history = gameState.current.quotaHistory;

		// Check if quota level changed or history has new entry
		if (history.length > 0) {
			const latest = history[history.length - 1];

			// Show notification if we have a new history entry
			if (lastHistoryEntry?.level !== latest.level || lastHistoryEntry?.timeUsed !== latest.timeUsed) {
				lastHistoryEntry = latest;
				notificationType = latest.success ? 'success' : 'failure';
				showNotification = true;

				// Auto-dismiss after 5 seconds
				setTimeout(() => {
					showNotification = false;
				}, 5000);
			}
		}
	});

	function dismiss() {
		showNotification = false;
	}

	function formatTime(ticks: number): string {
		const seconds = Math.floor(ticks / 30);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function getResourceName(resourceId: string): string {
		const resource = gameState.resources.get(resourceId);
		return resource?.name || resourceId;
	}
</script>

{#if showNotification && lastHistoryEntry}
	<div
		class="notification-overlay"
		onclick={dismiss}
		onkeydown={(e) => e.key === 'Escape' && dismiss()}
		role="button"
		tabindex="0"
	>
		<div
			class="notification-card {notificationType}"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			{#if notificationType === 'success'}
				<div class="notification-icon success-icon">✓</div>
				<h2>Quota Complete!</h2>
				<div class="notification-body">
					<p class="quota-summary">
						Collected <strong>{lastHistoryEntry.actualAmount}</strong> {getResourceName(lastHistoryEntry.resourceId)}
					</p>
					<p class="time-info">
						Time: {formatTime(lastHistoryEntry.timeUsed)}
					</p>

					{#if gameState.currentQuota}
						<div class="reward-box">
							<div class="reward-icon">🎁</div>
							<p class="reward-text">
								{lastHistoryEntry.rewardDescription || 'Reward unlocked!'}
							</p>
						</div>

						<div class="next-quota">
							<h3>Next Objective:</h3>
							<p>Collect {gameState.currentQuota.targetAmount} {getResourceName(gameState.currentQuota.resourceId)}</p>
						</div>
					{:else}
						<div class="reward-box victory">
							<div class="reward-icon">🏆</div>
							<p class="reward-text">All quotas complete! You've mastered automation!</p>
						</div>
					{/if}
				</div>
			{:else}
				<div class="notification-icon failure-icon">✗</div>
				<h2>Quota Failed</h2>
				<div class="notification-body">
					<p class="quota-summary">
						Only collected <strong>{lastHistoryEntry.actualAmount}</strong> / {lastHistoryEntry.targetAmount} {getResourceName(lastHistoryEntry.resourceId)}
					</p>
					<p class="time-info">
						Time ran out! ({formatTime(lastHistoryEntry.timeUsed)})
					</p>

					<div class="retry-box">
						<p>💡 Try optimizing your code to collect resources faster!</p>
						<p class="retry-text">The quota timer has been reset. Try again!</p>
					</div>
				</div>
			{/if}

			<button class="dismiss-btn" onclick={dismiss}>Continue</button>
		</div>
	</div>
{/if}

<style>
	.notification-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.notification-card {
		background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
		border-radius: 12px;
		padding: 32px;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		animation: slideIn 0.3s ease-out;
		position: relative;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-50px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.notification-card.success {
		border: 3px solid #4ade80;
	}

	.notification-card.failure {
		border: 3px solid #fb923c;
	}

	.notification-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32px;
		font-weight: bold;
		margin: 0 auto 16px;
	}

	.success-icon {
		background: #4ade80;
		color: #1a1a1a;
	}

	.failure-icon {
		background: #fb923c;
		color: #1a1a1a;
	}

	h2 {
		margin: 0 0 24px 0;
		text-align: center;
		font-size: 28px;
		color: #fff;
	}

	.notification-body {
		margin-bottom: 24px;
	}

	.quota-summary {
		font-size: 18px;
		text-align: center;
		margin-bottom: 8px;
		color: #d4d4d4;
	}

	.quota-summary strong {
		color: #4a9eff;
		font-size: 24px;
	}

	.time-info {
		text-align: center;
		color: #888;
		font-size: 14px;
		margin-bottom: 24px;
	}

	.reward-box, .retry-box {
		background: rgba(74, 158, 255, 0.1);
		border: 1px solid #4a9eff;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 16px;
		text-align: center;
	}

	.reward-box.victory {
		background: rgba(74, 222, 128, 0.1);
		border-color: #4ade80;
	}

	.retry-box {
		background: rgba(251, 146, 60, 0.1);
		border-color: #fb923c;
	}

	.reward-icon {
		font-size: 32px;
		margin-bottom: 8px;
	}

	.reward-text {
		color: #4ade80;
		font-weight: 600;
		margin: 0;
	}

	.retry-text {
		color: #fb923c;
		font-weight: 600;
		margin: 8px 0 0 0;
	}

	.next-quota {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 16px;
	}

	.next-quota h3 {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: #888;
		text-transform: uppercase;
	}

	.next-quota p {
		margin: 0;
		font-size: 16px;
		color: #4a9eff;
		font-weight: 600;
	}

	.dismiss-btn {
		width: 100%;
		padding: 12px 24px;
		background: #4a9eff;
		border: none;
		border-radius: 6px;
		color: #fff;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.dismiss-btn:hover {
		background: #60a5fa;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
	}

	.dismiss-btn:active {
		transform: translateY(0);
	}
</style>

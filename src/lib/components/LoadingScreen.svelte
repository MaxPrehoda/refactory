<script lang="ts">
	import { loadingState } from '$lib/stores/loadingState.svelte';
</script>

{#if loadingState.isLoading}
	<div class="loading-overlay">
		<div class="loading-content">
			<div class="loading-icon">🏭</div>
			<h2>ReFactory</h2>
			<p>{loadingState.loadingMessage}</p>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {loadingState.progress}%"></div>
			</div>
			<p class="loading-hint">Loading Python runtime (this may take a moment...)</p>
		</div>
	</div>
{/if}

<style>
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #1a1a1a;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.loading-content {
		text-align: center;
		max-width: 400px;
		padding: 40px;
	}

	.loading-icon {
		font-size: 64px;
		margin-bottom: 20px;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.8;
		}
	}

	h2 {
		margin: 0 0 12px 0;
		color: #fff;
		font-size: 32px;
		background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	p {
		color: #888;
		font-size: 14px;
		margin: 8px 0;
	}

	.loading-hint {
		font-size: 12px;
		color: #666;
		margin-top: 16px;
	}

	.progress-bar {
		width: 100%;
		height: 4px;
		background: #2a2a2a;
		border-radius: 2px;
		overflow: hidden;
		margin: 20px 0;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #4a90e2 0%, #357abd 100%);
		transition: width 0.3s ease;
	}
</style>

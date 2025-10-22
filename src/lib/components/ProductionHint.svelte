<script lang="ts">
	import { gameState } from '$lib/stores/gameState.svelte';
	import { onMount } from 'svelte';

	let showHint = $state(false);
	let dismissed = $state(false);
	let startTime = 0;

	const HINT_TRIGGER_TIME = 150; // 2.5 minutes in seconds (at 30 TPS = 4500 ticks)
	const HINT_TRIGGER_TICKS = HINT_TRIGGER_TIME * 30;

	onMount(() => {
		// Check if hint was previously dismissed
		const wasDismissed = localStorage.getItem('refactory-production-hint-dismissed');
		if (wasDismissed === 'true') {
			dismissed = true;
		}
	});

	// Reactive check for showing hint
	// Only check every second to avoid performance issues
	let lastCheckTick = 0;
	$effect(() => {
		const currentTick = gameState.tick;

		// Only check every 30 ticks (once per second) to reduce overhead
		if (currentTick - lastCheckTick < 30) {
			return;
		}

		lastCheckTick = currentTick;

		// Only show hint if:
		// 1. Not dismissed
		// 2. On first quota (quotaLevel === 1)
		// 3. Past 2.5 minutes (tick - quotaStartTick >= HINT_TRIGGER_TICKS)
		// 4. Haven't completed it yet (progress < 100%)
		if (
			!dismissed &&
			gameState.current.quotaLevel === 1 &&
			gameState.current.currentQuota &&
			(currentTick - gameState.current.quotaStartTick) >= HINT_TRIGGER_TICKS &&
			gameState.quotaProgress < 1
		) {
			showHint = true;
		}
	});

	function dismissHint() {
		showHint = false;
		dismissed = true;
		localStorage.setItem('refactory-production-hint-dismissed', 'true');
	}
</script>

{#if showHint}
	<div class="hint-overlay">
		<div class="hint-card">
			<div class="hint-header">
				<h3>💡 Production Tip</h3>
				<button class="close-btn" onclick={dismissHint}>×</button>
			</div>
			<div class="hint-content">
				<p class="hint-intro">
					Need help increasing {gameState.current.currentQuota?.resourceId} production? Here are some strategies:
				</p>
				<ul class="hint-list">
					<li>
						<strong>Filter resources:</strong> Only pickup iron by checking <code>resource["resource_type"] == "iron"</code>
					</li>
					<li>
						<strong>Target closest resources:</strong> Sort resources by distance to minimize travel time
					</li>
					<li>
						<strong>Reduce scan radius:</strong> Smaller radius (100-150) is faster than large scans (300+)
					</li>
					<li>
						<strong>Cache storage location:</strong> Don't scan for storage every tick - save its position
					</li>
				</ul>
				<div class="hint-example">
					<strong>Example optimization:</strong>
					<pre><code># Find closest iron resource
resources = robot_api.scan_resources(radius=150)
iron_only = [r for r in resources if r["resource_type"] == "iron"]
if iron_only:
    # Sort by distance
    closest = min(iron_only, key=lambda r:
        (r["x"] - position["x"])**2 + (r["y"] - position["y"])**2
    )</code></pre>
				</div>
			</div>
			<div class="hint-footer">
				<button class="dismiss-btn" onclick={dismissHint}>Got it, thanks!</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.hint-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.hint-card {
		background: #2a2a2a;
		border: 2px solid #4a90e2;
		border-radius: 8px;
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.hint-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid #444;
		background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
	}

	.hint-header h3 {
		margin: 0;
		font-size: 20px;
		color: #fff;
	}

	.close-btn {
		background: none;
		border: none;
		color: #888;
		font-size: 32px;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.hint-content {
		padding: 20px;
		color: #ddd;
	}

	.hint-intro {
		margin: 0 0 16px 0;
		font-size: 15px;
		color: #fff;
	}

	.hint-list {
		margin: 0 0 20px 0;
		padding-left: 20px;
		list-style: none;
	}

	.hint-list li {
		margin-bottom: 12px;
		padding-left: 24px;
		position: relative;
		line-height: 1.6;
	}

	.hint-list li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: #4a90e2;
		font-weight: bold;
	}

	.hint-list strong {
		color: #4a90e2;
	}

	.hint-list code {
		background: #1e1e1e;
		padding: 2px 6px;
		border-radius: 3px;
		color: #ff6b6b;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 13px;
	}

	.hint-example {
		background: #1e1e1e;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 12px;
		margin-top: 16px;
	}

	.hint-example strong {
		display: block;
		margin-bottom: 8px;
		color: #4a90e2;
		font-size: 14px;
	}

	.hint-example pre {
		margin: 0;
		overflow-x: auto;
	}

	.hint-example code {
		display: block;
		color: #ddd;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 13px;
		line-height: 1.5;
	}

	.hint-footer {
		padding: 16px 20px;
		border-top: 1px solid #444;
		display: flex;
		justify-content: flex-end;
		background: #1e1e1e;
	}

	.dismiss-btn {
		padding: 10px 20px;
		background: #4a90e2;
		border: none;
		border-radius: 4px;
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.dismiss-btn:hover {
		background: #357abd;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
	}

	.dismiss-btn:active {
		transform: translateY(0);
	}

	/* Scrollbar styling */
	.hint-card::-webkit-scrollbar {
		width: 8px;
	}

	.hint-card::-webkit-scrollbar-track {
		background: #1e1e1e;
	}

	.hint-card::-webkit-scrollbar-thumb {
		background: #444;
		border-radius: 4px;
	}

	.hint-card::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>

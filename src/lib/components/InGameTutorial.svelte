<script lang="ts">
	import { onMount } from 'svelte';

	let showTutorial = $state(true);
	let currentHint = $state(0);

	const hints = [
		{
			title: "Welcome to ReFactory! 🏭",
			message: "Your robot is already running code to gather resources. Watch it work on the factory floor!",
			highlight: "factory-canvas"
		},
		{
			title: "The Code Editor 💻",
			message: "Your robot's brain is this Python code. It works, but it's inefficient - scanning huge areas every tick wastes energy!",
			highlight: "code-editor"
		},
		{
			title: "Watch Your Resources 📊",
			message: "See iron ore accumulating as your robot delivers to storage. The robot will keep working automatically.",
			highlight: "hud"
		},
		{
			title: "Ready to Optimize? ⚡",
			message: "Try reducing the search radius from 300 to 150. Or cache the storage location instead of finding it every tick. Make it faster!",
			highlight: "code-editor"
		}
	];

	onMount(() => {
		const seen = localStorage.getItem('refactory-hints-seen');
		if (seen) {
			showTutorial = false;
		}
	});

	function nextHint() {
		if (currentHint < hints.length - 1) {
			currentHint++;
		} else {
			dismissTutorial();
		}
	}

	function prevHint() {
		if (currentHint > 0) {
			currentHint--;
		}
	}

	function dismissTutorial() {
		showTutorial = false;
		localStorage.setItem('refactory-hints-seen', 'true');
	}
</script>

{#if showTutorial}
	<div class="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
		<div class="tutorial-panel">
			<button
				class="close-btn"
				onclick={dismissTutorial}
				aria-label="Close tutorial"
			>✕</button>

			<div class="tutorial-content">
				<h3 id="tutorial-title">{hints[currentHint].title}</h3>
				<p>{hints[currentHint].message}</p>
			</div>

			<div class="tutorial-nav">
				<button
					class="nav-btn"
					onclick={prevHint}
					disabled={currentHint === 0}
				>
					← Previous
				</button>

				<div class="progress-dots">
					{#each hints as _, index}
						<button
							class="dot"
							class:active={index === currentHint}
							onclick={() => (currentHint = index)}
							aria-label="Go to hint {index + 1}"
						></button>
					{/each}
				</div>

				<button class="nav-btn primary" onclick={nextHint}>
					{currentHint === hints.length - 1 ? 'Got it!' : 'Next →'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.tutorial-overlay {
		position: fixed;
		top: 80px;
		right: 20px;
		z-index: 100;
		pointer-events: none;
	}

	.tutorial-panel {
		background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
		border: 2px solid #4a90e2;
		border-radius: 8px;
		padding: 20px;
		width: 350px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		pointer-events: auto;
		position: relative;
	}

	.close-btn {
		position: absolute;
		top: 10px;
		right: 10px;
		background: none;
		border: none;
		color: #888;
		font-size: 20px;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: #3a3a3a;
		color: #fff;
	}

	.tutorial-content {
		margin-bottom: 20px;
	}

	.tutorial-content h3 {
		margin: 0 0 12px 0;
		color: #4a90e2;
		font-size: 18px;
	}

	.tutorial-content p {
		margin: 0;
		color: #ccc;
		font-size: 14px;
		line-height: 1.6;
	}

	.tutorial-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.nav-btn {
		padding: 8px 16px;
		background: #3a3a3a;
		border: 1px solid #555;
		border-radius: 4px;
		color: #ccc;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.nav-btn:hover:not(:disabled) {
		background: #4a4a4a;
		border-color: #666;
	}

	.nav-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.nav-btn.primary {
		background: #4a90e2;
		border-color: #4a90e2;
		color: #fff;
	}

	.nav-btn.primary:hover {
		background: #357abd;
		border-color: #357abd;
	}

	.progress-dots {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #555;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		padding: 0;
	}

	.dot:hover {
		background: #777;
	}

	.dot.active {
		background: #4a90e2;
		width: 10px;
		height: 10px;
	}
</style>

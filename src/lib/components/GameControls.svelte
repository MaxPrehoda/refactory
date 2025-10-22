<script lang="ts">
	import { gameState } from '$lib/stores/gameState.svelte';
	import { gameLoop } from '$lib/engine/gameLoop.svelte';

	function togglePause() {
		gameState.togglePause();
	}

	function reset() {
		if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
			gameLoop.reset();
		}
	}

	function save() {
		gameState.saveToLocalStorage();
		alert('Game saved successfully!');
	}

	function load() {
		if (gameState.loadFromLocalStorage()) {
			alert('Game loaded successfully!');
		} else {
			alert('No saved game found.');
		}
	}

	function changeSpeed(delta: number) {
		gameState.setGameSpeed(gameState.current.gameSpeed + delta);
	}
</script>

<div class="game-controls">
	<button onclick={togglePause} class="control-btn {gameState.isPaused ? 'paused' : ''}">
		{gameState.isPaused ? '▶️ Resume' : '⏸️ Pause'}
	</button>

	<div class="speed-controls">
		<button onclick={() => changeSpeed(-0.5)} class="control-btn small" disabled={gameState.current.gameSpeed <= 0.1}>
			-
		</button>
		<span class="speed-display">{gameState.current.gameSpeed.toFixed(1)}x</span>
		<button onclick={() => changeSpeed(0.5)} class="control-btn small" disabled={gameState.current.gameSpeed >= 5}>
			+
		</button>
	</div>

	<button onclick={save} class="control-btn">💾 Save</button>
	<button onclick={load} class="control-btn">📁 Load</button>
	<button onclick={reset} class="control-btn danger">🔄 Reset</button>
</div>

<style>
	.game-controls {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 12px;
		background: #2a2a2a;
		border: 2px solid #444;
		border-radius: 4px;
	}

	.control-btn {
		padding: 8px 16px;
		background: #3a3a3a;
		border: 1px solid #555;
		border-radius: 4px;
		color: #fff;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.control-btn:hover {
		background: #4a4a4a;
		border-color: #666;
	}

	.control-btn:active {
		transform: translateY(1px);
	}

	.control-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.control-btn.paused {
		background: #44ff44;
		color: #000;
		border-color: #44ff44;
	}

	.control-btn.danger {
		background: #ff4444;
		border-color: #ff4444;
	}

	.control-btn.danger:hover {
		background: #ff6666;
	}

	.control-btn.small {
		padding: 4px 12px;
		font-size: 16px;
		font-weight: 600;
	}

	.speed-controls {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 8px;
		border-left: 1px solid #555;
		border-right: 1px solid #555;
	}

	.speed-display {
		min-width: 40px;
		text-align: center;
		color: #fff;
		font-size: 13px;
		font-weight: 600;
	}
</style>

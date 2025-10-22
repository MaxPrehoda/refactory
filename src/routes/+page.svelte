<script lang="ts">
	import { onMount } from 'svelte';
	import { gameLoop } from '$lib/engine/gameLoop.svelte';
	import FactoryCanvas from '$lib/components/FactoryCanvas.svelte';
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	import GameHUD from '$lib/components/GameHUD.svelte';
	import GameControls from '$lib/components/GameControls.svelte';
	import InGameTutorial from '$lib/components/InGameTutorial.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import QuotaDisplay from '$lib/components/QuotaDisplay.svelte';
	import QuotaNotification from '$lib/components/QuotaNotification.svelte';
	import Marketplace from '$lib/components/Marketplace.svelte';
	import ProductionHint from '$lib/components/ProductionHint.svelte';
	import BugWarning from '$lib/components/BugWarning.svelte';

	let factoryViewElement: HTMLElement;
	let codeEditorViewElement: HTMLElement;
	let resizeDividerElement: HTMLElement;
	let isResizing = false;
	let startY = 0;
	let startFactoryHeight = 0;
	let startCodeHeight = 0;

	onMount(() => {
		// Start the game loop
		gameLoop.start();

		// Setup resize functionality
		const handleMouseDown = (e: MouseEvent) => {
			isResizing = true;
			startY = e.clientY;
			startFactoryHeight = factoryViewElement.offsetHeight;
			startCodeHeight = codeEditorViewElement.offsetHeight;
			document.body.style.cursor = 'ns-resize';
			e.preventDefault();
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing) return;

			const deltaY = e.clientY - startY;
			const newFactoryHeight = startFactoryHeight + deltaY;
			const newCodeHeight = startCodeHeight - deltaY;

			// Enforce minimum heights
			if (newFactoryHeight >= 200 && newCodeHeight >= 200) {
				factoryViewElement.style.flex = `0 0 ${newFactoryHeight}px`;
				codeEditorViewElement.style.flex = `1 1 auto`;
			}
		};

		const handleMouseUp = () => {
			if (isResizing) {
				isResizing = false;
				document.body.style.cursor = '';
			}
		};

		resizeDividerElement.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		// Cleanup on unmount
		return () => {
			gameLoop.stop();
			resizeDividerElement?.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	});
</script>

<svelte:head>
	<title>ReFactory - Factory Automation Programming Game</title>
</svelte:head>

<LoadingScreen />
<InGameTutorial />
<QuotaNotification />
<ProductionHint />
<BugWarning />

<div class="game-container">
	<header class="game-header">
		<h1>🏭 ReFactory</h1>
		<p class="tagline">Program robots. Automate production. Optimize everything.</p>
	</header>

	<div class="controls-bar">
		<GameControls />
	</div>

	<main class="game-main">
		<aside class="sidebar left">
			<QuotaDisplay />
			<GameHUD />
		</aside>

		<div class="game-content">
			<section class="factory-view" bind:this={factoryViewElement}>
				<h2>Factory Floor</h2>
				<FactoryCanvas />
			</section>

			<div class="resize-divider" bind:this={resizeDividerElement} title="Drag to resize">
				<div class="resize-handle">
					<div class="resize-dots"></div>
				</div>
			</div>

			<section class="code-editor-view" bind:this={codeEditorViewElement}>
				<CodeEditor />
			</section>
		</div>

		<aside class="sidebar right">
			<Marketplace />
		</aside>
	</main>

	<footer class="game-footer">
		<p>
			💡 Tip: Write efficient code to save energy. Use
			<code>robot.get_nearby_resources(radius)</code> to find resources nearby.
		</p>
		<button class="restart-tutorial-btn" onclick={() => {
			localStorage.removeItem('refactory-tutorial-seen');
			window.location.reload();
		}}>
			Restart Tutorial
		</button>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #1a1a1a;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
		color: #fff;
		overflow: hidden;
	}

	.game-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
	}

	.game-header {
		background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
		padding: 16px 24px;
		border-bottom: 2px solid #444;
		text-align: center;
	}

	.game-header h1 {
		margin: 0;
		font-size: 32px;
		font-weight: 700;
		background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.tagline {
		margin: 4px 0 0 0;
		font-size: 14px;
		color: #888;
	}

	.controls-bar {
		padding: 8px 16px;
		background: #1e1e1e;
		border-bottom: 1px solid #333;
	}

	.game-main {
		display: flex;
		flex: 1;
		overflow: hidden;
		gap: 12px;
		padding: 12px;
		background: #1a1a1a;
	}

	.sidebar {
		width: 280px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.sidebar.left {
		order: 1;
	}

	.sidebar.right {
		order: 3;
	}

	.game-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
		overflow: hidden;
		order: 2;
	}

	.factory-view,
	.code-editor-view {
		background: #2a2a2a;
		border-radius: 4px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 200px;
	}

	.factory-view {
		flex: 1 1 40%;
	}

	.factory-view h2 {
		margin: 0 0 8px 0;
		font-size: 16px;
		color: #888;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.code-editor-view {
		flex: 1 1 60%;
		padding: 0;
	}

	.resize-divider {
		height: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: ns-resize;
		position: relative;
		z-index: 10;
		flex-shrink: 0;
	}

	.resize-divider:hover .resize-handle {
		background: #4a90e2;
	}

	.resize-handle {
		width: 60px;
		height: 4px;
		background: #444;
		border-radius: 2px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.resize-dots {
		width: 30px;
		height: 2px;
		background-image: radial-gradient(circle, #888 1px, transparent 1px);
		background-size: 6px 2px;
		background-repeat: repeat-x;
	}

	.game-footer {
		background: #1e1e1e;
		border-top: 1px solid #333;
		padding: 8px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 12px;
		color: #888;
	}

	.game-footer p {
		margin: 0;
		flex: 1;
		text-align: center;
	}

	.restart-tutorial-btn {
		padding: 4px 10px;
		background: none;
		border: 1px solid #444;
		border-radius: 3px;
		color: #888;
		font-size: 10px;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.restart-tutorial-btn:hover {
		border-color: #4a90e2;
		color: #4a90e2;
		background: rgba(74, 144, 226, 0.1);
	}

	.game-footer code {
		background: #2a2a2a;
		padding: 2px 6px;
		border-radius: 3px;
		color: #4a90e2;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	}

	/* Scrollbar styling */
	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: #1e1e1e;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: #444;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: #555;
	}

	/* Responsive design */
	@media (max-width: 1200px) {
		.game-main {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			max-height: 200px;
		}
	}
</style>

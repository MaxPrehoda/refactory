<script lang="ts">
	import { onMount } from 'svelte';

	let showTutorial = $state(false);
	let currentStep = $state(0);

	const tutorialSteps = [
		{
			title: 'Welcome to ReFactory! 🤖',
			content: 'In this game, you program robots to automate factory production using JavaScript/TypeScript. Your code runs in real-time!'
		},
		{
			title: 'Your First Robot',
			content: 'You start with one robot. Use the code editor on the right to write JavaScript that controls it. The update() function runs every game tick.'
		},
		{
			title: 'Gathering Resources',
			content: 'Use robot.getNearbyResources(radius) to find resource nodes, then robot.moveTo(position) to move, and robot.pickup(node) to collect resources.'
		},
		{
			title: 'Energy Management ⚡',
			content: 'Every action costs energy. Watch the energy bar in the HUD. Inefficient code drains power faster - optimize for better performance!'
		},
		{
			title: 'Building Production',
			content: 'As you collect resources, you\'ll unlock machines and new departments. Build automated production chains to progress!'
		}
	];

	onMount(() => {
		const hasSeenTutorial = localStorage.getItem('refactory-tutorial-seen');
		if (!hasSeenTutorial) {
			showTutorial = true;
		}
	});

	function nextStep() {
		if (currentStep < tutorialSteps.length - 1) {
			currentStep++;
		} else {
			closeTutorial();
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function closeTutorial() {
		showTutorial = false;
		localStorage.setItem('refactory-tutorial-seen', 'true');
	}

	function skipTutorial() {
		closeTutorial();
	}
</script>

{#if showTutorial}
	<div class="tutorial-overlay">
		<div class="tutorial-modal">
			<div class="tutorial-header">
				<h2>{tutorialSteps[currentStep].title}</h2>
				<button onclick={closeTutorial} class="close-btn">✕</button>
			</div>

			<div class="tutorial-content">
				<p>{tutorialSteps[currentStep].content}</p>
			</div>

			<div class="tutorial-footer">
				<div class="progress-dots">
					{#each tutorialSteps as _, index}
						<span class="dot" class:active={index === currentStep}></span>
					{/each}
				</div>

				<div class="tutorial-buttons">
					{#if currentStep > 0}
						<button onclick={prevStep} class="tutorial-btn secondary">← Back</button>
					{:else}
						<button onclick={skipTutorial} class="tutorial-btn secondary">Skip Tutorial</button>
					{/if}

					<button onclick={nextStep} class="tutorial-btn primary">
						{currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next →'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.tutorial-overlay {
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
		backdrop-filter: blur(4px);
	}

	.tutorial-modal {
		background: #2a2a2a;
		border: 2px solid #444;
		border-radius: 8px;
		width: 90%;
		max-width: 600px;
		padding: 24px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.tutorial-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.tutorial-header h2 {
		margin: 0;
		color: #fff;
		font-size: 24px;
	}

	.close-btn {
		background: none;
		border: none;
		color: #888;
		font-size: 24px;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: #3a3a3a;
		color: #fff;
	}

	.tutorial-content {
		margin-bottom: 24px;
		min-height: 120px;
	}

	.tutorial-content p {
		color: #ccc;
		font-size: 16px;
		line-height: 1.6;
		margin: 0;
	}

	.tutorial-footer {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.progress-dots {
		display: flex;
		justify-content: center;
		gap: 8px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #555;
		transition: all 0.3s;
	}

	.dot.active {
		background: #4a90e2;
		width: 24px;
		border-radius: 4px;
	}

	.tutorial-buttons {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	.tutorial-btn {
		padding: 10px 24px;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		flex: 1;
	}

	.tutorial-btn.primary {
		background: #4a90e2;
		color: #fff;
	}

	.tutorial-btn.primary:hover {
		background: #357abd;
	}

	.tutorial-btn.secondary {
		background: #3a3a3a;
		color: #ccc;
		border: 1px solid #555;
	}

	.tutorial-btn.secondary:hover {
		background: #4a4a4a;
		border-color: #666;
	}
</style>

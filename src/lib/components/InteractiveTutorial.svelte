<script lang="ts">
	import { onMount } from 'svelte';
	import { gameState } from '$lib/stores/gameState.svelte';

	let showTutorial = $state(false);
	let currentStep = $state(0);
	let userCode = $state('');
	let challengeComplete = $state(false);
	let challengeMessage = $state('');

	interface TutorialStep {
		title: string;
		content: string;
		challenge?: {
			description: string;
			starterCode: string;
			hint: string;
			validator: (code: string) => { success: boolean; message: string };
		};
	}

	const tutorialSteps: TutorialStep[] = [
		{
			title: 'Welcome to ReFactory! 🤖',
			content: 'In this game, you program robots to automate factory production using Python. Your code runs in real-time, and you can see your robots execute your instructions on the factory floor!'
		},
		{
			title: 'Challenge 1: Move Your Robot',
			content: 'Let\'s start simple. You have one robot on the factory floor. Use the <code>robot.move_to(x, y)</code> function to move it to position (200, 200).',
			challenge: {
				description: 'Move the robot to coordinates (200, 200)',
				starterCode: '# Move the robot to position (200, 200)\n\n',
				hint: 'Use: robot.move_to(200, 200)',
				validator: (code: string) => {
					if (code.includes('robot.move_to') && code.includes('200') && code.includes('200')) {
						return { success: true, message: 'Perfect! You\'ve learned how to move a robot!' };
					}
					return { success: false, message: 'Try using robot.move_to(200, 200)' };
				}
			}
		},
		{
			title: 'Challenge 2: Find Resources',
			content: 'Robots can scan for nearby resources. Use <code>robot.get_nearby_resources(radius)</code> to find resources within a certain range.',
			challenge: {
				description: 'Find resources within 150 units and print how many you found',
				starterCode: '# Find nearby resources\nresources = robot.get_nearby_resources(150)\n\n# Print the count\n',
				hint: 'Use print(len(resources)) to see how many resources are nearby',
				validator: (code: string) => {
					if (code.includes('get_nearby_resources') &&
					    (code.includes('print') || code.includes('len'))) {
						return { success: true, message: 'Great! You can now detect resources!' };
					}
					return { success: false, message: 'Try finding resources and printing the count' };
				}
			}
		},
		{
			title: 'Challenge 3: Collect Resources',
			content: 'Now let\'s gather some resources! First find nearby resources, move to one, and pick it up.',
			challenge: {
				description: 'Find a resource, move to it, and pick it up',
				starterCode: '# Find nearby resources\nresources = robot.get_nearby_resources(200)\n\n# If we found any resources\nif len(resources) > 0:\n    # Get the first resource\n    resource = resources[0]\n    \n    # Move to it\n    robot.move_to(resource["position"]["x"], resource["position"]["y"])\n    \n    # Pick it up\n    # YOUR CODE HERE\n',
				hint: 'Use robot.pickup(resource) to collect the resource',
				validator: (code: string) => {
					if (code.includes('robot.pickup') &&
					    code.includes('get_nearby_resources') &&
					    code.includes('move_to')) {
						return { success: true, message: 'Excellent! You\'re automating production!' };
					}
					return { success: false, message: 'Remember to use robot.pickup(resource)' };
				}
			}
		},
		{
			title: 'Challenge 4: Build a Loop',
			content: 'The real power comes from automation! Wrap your resource gathering code in a simple pattern that checks if the robot is idle.',
			challenge: {
				description: 'Create code that continuously gathers resources when idle',
				starterCode: '# Check robot status\nif robot.get_status() == "idle":\n    # Find nearby resources\n    resources = robot.get_nearby_resources(200)\n    \n    # If resources exist and robot isn\'t carrying anything\n    inventory = robot.get_inventory()\n    if len(resources) > 0 and inventory["type"] is None:\n        # Get first resource\n        resource = resources[0]\n        \n        # Move to it\n        robot.move_to(resource["position"]["x"], resource["position"]["y"])\n        \n        # Pick it up (add this!)\n        # YOUR CODE HERE\n',
				hint: 'Add robot.pickup(resource) to complete the automation',
				validator: (code: string) => {
					if (code.includes('robot.pickup') &&
					    code.includes('get_status') &&
					    code.includes('get_inventory')) {
						return { success: true, message: 'Perfect! You\'ve built your first automation!' };
					}
					return { success: false, message: 'Make sure to check status and inventory before picking up' };
				}
			}
		},
		{
			title: 'You\'re Ready! 🎉',
			content: 'You\'ve mastered the basics! Now you can experiment freely. Try optimizing your code for energy efficiency, building complex production chains, or programming multiple robots to work together. The factory is yours to automate!'
		}
	];

	onMount(() => {
		const hasSeenTutorial = localStorage.getItem('refactory-tutorial-seen');
		if (!hasSeenTutorial) {
			showTutorial = true;
			// Set initial code if there's a challenge
			updateChallengeCode();
		}
	});

	function updateChallengeCode() {
		const step = tutorialSteps[currentStep];
		if (step.challenge) {
			userCode = step.challenge.starterCode;
			challengeComplete = false;
			challengeMessage = '';
		}
	}

	function validateChallenge() {
		const step = tutorialSteps[currentStep];
		if (!step.challenge) return;

		const result = step.challenge.validator(userCode);
		challengeComplete = result.success;
		challengeMessage = result.message;

		if (result.success) {
			// Update the actual game code
			if (gameState.activeCode) {
				gameState.updateCode(gameState.activeCode.id, userCode);
			}
		}
	}

	function nextStep() {
		if (currentStep < tutorialSteps.length - 1) {
			currentStep++;
			updateChallengeCode();
		} else {
			closeTutorial();
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
			updateChallengeCode();
		}
	}

	function closeTutorial() {
		showTutorial = false;
		localStorage.setItem('refactory-tutorial-seen', 'true');
	}

	function skipTutorial() {
		closeTutorial();
	}

	function showHint() {
		const step = tutorialSteps[currentStep];
		if (step.challenge) {
			alert(step.challenge.hint);
		}
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
				<p>{@html tutorialSteps[currentStep].content}</p>

				{#if tutorialSteps[currentStep].challenge}
					<div class="challenge-section">
						<h3>🎯 {tutorialSteps[currentStep].challenge!.description}</h3>

						<textarea
							bind:value={userCode}
							class="challenge-editor"
							rows="12"
							spellcheck="false"
						></textarea>

						<div class="challenge-controls">
							<button onclick={validateChallenge} class="validate-btn">
								✓ Check My Code
							</button>
							<button onclick={showHint} class="hint-btn">
								💡 Show Hint
							</button>
						</div>

						{#if challengeMessage}
							<div class="challenge-feedback" class:success={challengeComplete} class:error={!challengeComplete}>
								{challengeMessage}
							</div>
						{/if}
					</div>
				{/if}
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

					{#if tutorialSteps[currentStep].challenge}
						<button
							onclick={nextStep}
							class="tutorial-btn primary"
							disabled={!challengeComplete}
						>
							{currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next →'}
						</button>
					{:else}
						<button onclick={nextStep} class="tutorial-btn primary">
							{currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next →'}
						</button>
					{/if}
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
		background: rgba(0, 0, 0, 0.85);
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
		max-width: 800px;
		max-height: 90vh;
		padding: 24px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		overflow-y: auto;
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
		margin: 0 0 20px 0;
	}

	.tutorial-content :global(code) {
		background: #1e1e1e;
		padding: 2px 6px;
		border-radius: 3px;
		color: #4a90e2;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	}

	.challenge-section {
		background: #1e1e1e;
		padding: 16px;
		border-radius: 6px;
		border: 2px solid #444;
	}

	.challenge-section h3 {
		margin: 0 0 12px 0;
		color: #4a90e2;
		font-size: 16px;
	}

	.challenge-editor {
		width: 100%;
		background: #1a1a1a;
		color: #d4d4d4;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 12px;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.5;
		resize: vertical;
		margin-bottom: 12px;
	}

	.challenge-editor:focus {
		outline: none;
		border-color: #4a90e2;
	}

	.challenge-controls {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	.validate-btn,
	.hint-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.validate-btn {
		background: #44aa44;
		color: #fff;
		flex: 1;
	}

	.validate-btn:hover {
		background: #55bb55;
	}

	.hint-btn {
		background: #3a3a3a;
		color: #ccc;
		border: 1px solid #555;
	}

	.hint-btn:hover {
		background: #4a4a4a;
	}

	.challenge-feedback {
		padding: 12px;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 600;
	}

	.challenge-feedback.success {
		background: rgba(68, 170, 68, 0.2);
		border: 1px solid #44aa44;
		color: #66ff66;
	}

	.challenge-feedback.error {
		background: rgba(255, 68, 68, 0.2);
		border: 1px solid #ff4444;
		color: #ff8888;
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

	.tutorial-btn.primary:hover:not(:disabled) {
		background: #357abd;
	}

	.tutorial-btn.primary:disabled {
		background: #555;
		cursor: not-allowed;
		opacity: 0.5;
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

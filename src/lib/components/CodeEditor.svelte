<script lang="ts">
	import { onMount } from 'svelte';
	import { gameState } from '$lib/stores/gameState.svelte';

	let textarea: HTMLTextAreaElement;
	let code = $state(gameState.activeCode?.code || '');

	onMount(() => {
		// Load initial code
		if (gameState.activeCode) {
			code = gameState.activeCode.code;
		}
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		code = target.value;

		// Update game state
		if (gameState.activeCode) {
			gameState.updateCode(gameState.activeCode.id, code);
		}
	}

	function handleTab(e: KeyboardEvent) {
		if (e.key === 'Tab') {
			e.preventDefault();
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const value = textarea.value;

			// Use 4 spaces for Python indentation
			textarea.value = value.substring(0, start) + '    ' + value.substring(end);
			textarea.selectionStart = textarea.selectionEnd = start + 4;

			// Trigger input event
			handleInput(new Event('input'));
		}
	}
</script>

<div class="code-editor">
	<div class="editor-header">
		<h3>Robot Controller</h3>
		<div class="editor-info">
			<span class="language">Python</span>
			{#if gameState.activeCode}
				<span class="last-modified">
					Modified: {new Date(gameState.activeCode.lastModified).toLocaleTimeString()}
				</span>
			{/if}
		</div>
	</div>

	<textarea
		bind:this={textarea}
		value={code}
		oninput={handleInput}
		onkeydown={handleTab}
		class="code-textarea"
		spellcheck="false"
		autocomplete="off"
		autocorrect="off"
		autocapitalize="off"
	/>

	<div class="editor-footer">
		<div class="tips">
			<strong>Available Functions:</strong>
			<code>robot_api.move_to(x, y)</code> |
			<code>robot_api.pickup(resource_id)</code> |
			<code>robot_api.dropoff(machine_id)</code> |
			<code>robot_api.scan_resources(radius)</code> |
			<code>robot_api.get_inventory()</code>
		</div>
	</div>
</div>

<style>
	.code-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #1e1e1e;
		border: 2px solid #444;
		border-radius: 4px;
		overflow: hidden;
	}

	.editor-header {
		padding: 8px 12px;
		background: #2d2d2d;
		border-bottom: 1px solid #444;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.editor-header h3 {
		margin: 0;
		color: #fff;
		font-size: 14px;
		font-weight: 600;
	}

	.editor-info {
		display: flex;
		gap: 12px;
		font-size: 11px;
		color: #888;
	}

	.language {
		padding: 2px 6px;
		background: #3a3a3a;
		border-radius: 3px;
	}

	.code-textarea {
		flex: 1;
		width: 100%;
		padding: 12px;
		background: #1e1e1e;
		color: #d4d4d4;
		border: none;
		outline: none;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.5;
		resize: none;
		tab-size: 4;
	}

	.code-textarea::selection {
		background: #264f78;
	}

	.editor-footer {
		padding: 8px 12px;
		background: #2d2d2d;
		border-top: 1px solid #444;
		font-size: 11px;
		color: #888;
	}

	.tips {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}

	.tips code {
		padding: 2px 4px;
		background: #3a3a3a;
		color: #9cdcfe;
		border-radius: 2px;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 11px;
	}
</style>

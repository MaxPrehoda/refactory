<script lang="ts">
	import { onMount } from 'svelte';
	import { gameState } from '$lib/stores/gameState.svelte';
	import type { Position } from '$lib/types/game';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let containerWidth = $state(800);
	let containerHeight = $state(600);

	const CELL_SIZE = 40;
	const GRID_COLOR = '#2a2a2a';
	const BG_COLOR = '#1a1a1a';

	// Animation state
	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		maxLife: number;
		color: string;
		size: number;
	}

	interface RobotRenderState {
		x: number;
		y: number;
		rotation: number;
	}

	let particles: Particle[] = [];
	let robotRenderStates = new Map<string, RobotRenderState>();
	let lastFrameTime = performance.now();
	let resourceSpawnTimes = new Map<string, number>();
	let lastRobotStates = new Map<string, { carrying: string | null; position: {x: number, y: number} }>();

	// Camera/zoom state
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let lastMouseX = 0;
	let lastMouseY = 0;

	onMount(() => {
		ctx = canvas.getContext('2d');

		// Set canvas size to match container
		const resizeCanvas = () => {
			const parent = canvas.parentElement;
			if (parent) {
				containerWidth = parent.clientWidth;
				containerHeight = parent.clientHeight;
			}
		};

		resizeCanvas();

		// Use ResizeObserver to watch for container size changes
		let resizeObserver: ResizeObserver | null = null;
		if (canvas.parentElement) {
			resizeObserver = new ResizeObserver(() => {
				resizeCanvas();
			});
			resizeObserver.observe(canvas.parentElement);
		}

		// Also listen to window resize as fallback
		window.addEventListener('resize', resizeCanvas);

		// Mouse wheel zoom
		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));

			// Zoom towards mouse position
			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			// Adjust pan to zoom towards mouse
			const worldX = (mouseX - panX) / zoom;
			const worldY = (mouseY - panY) / zoom;

			panX = mouseX - worldX * newZoom;
			panY = mouseY - worldY * newZoom;
			zoom = newZoom;
		};

		// Mouse drag to pan
		const handleMouseDown = (e: MouseEvent) => {
			isDragging = true;
			lastMouseX = e.clientX;
			lastMouseY = e.clientY;
			canvas.style.cursor = 'grabbing';
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const dx = e.clientX - lastMouseX;
				const dy = e.clientY - lastMouseY;
				panX += dx;
				panY += dy;
				lastMouseX = e.clientX;
				lastMouseY = e.clientY;
			}
		};

		const handleMouseUp = () => {
			isDragging = false;
			canvas.style.cursor = 'grab';
		};

		canvas.addEventListener('wheel', handleWheel, { passive: false });
		canvas.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		if (ctx) {
			// Start render loop
			requestAnimationFrame(render);
		}

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			resizeObserver?.disconnect();
			canvas.removeEventListener('wheel', handleWheel);
			canvas.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	});

	// Helper: lerp for smooth interpolation
	function lerp(start: number, end: number, t: number): number {
		return start + (end - start) * t;
	}

	// Helper: create particles
	function createParticles(x: number, y: number, color: string, count: number = 8) {
		for (let i = 0; i < count; i++) {
			const angle = (Math.PI * 2 * i) / count;
			const speed = 2 + Math.random() * 2;
			particles.push({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: 1,
				maxLife: 1,
				color,
				size: 3 + Math.random() * 2
			});
		}
	}

	// Update particles
	function updateParticles(deltaTime: number) {
		const dt = deltaTime / 16.67; // Normalize to 60fps
		particles = particles.filter(p => {
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vx *= 0.95; // Friction
			p.vy *= 0.95;
			p.life -= 0.02 * dt;
			return p.life > 0;
		});
	}

	// Draw particles
	function drawParticles() {
		if (!ctx) return;
		for (const p of particles) {
			const alpha = p.life;
			ctx.fillStyle = p.color;
			ctx.globalAlpha = alpha;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}

	function drawGrid() {
		if (!ctx || !canvas) return;

		ctx.strokeStyle = GRID_COLOR;
		ctx.lineWidth = 1;

		// Draw grid larger than viewport to cover panning
		const gridSize = 2000;

		// Vertical lines
		for (let x = 0; x <= gridSize; x += CELL_SIZE) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, gridSize);
			ctx.stroke();
		}

		// Horizontal lines
		for (let y = 0; y <= gridSize; y += CELL_SIZE) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(gridSize, y);
			ctx.stroke();
		}
	}

	function drawSpawnedResource(resource: typeof gameState.spawnedResources[0]) {
		if (!ctx) return;

		const x = resource.position.x;
		const y = resource.position.y;

		// Track spawn time for animation
		if (!resourceSpawnTimes.has(resource.id)) {
			resourceSpawnTimes.set(resource.id, performance.now());
			createParticles(x, y, resource.resourceType === 'iron' ? '#8B8B8B' : '#FF6B35', 12);
		}

		const spawnTime = resourceSpawnTimes.get(resource.id) || 0;
		const age = performance.now() - spawnTime;
		const spawnDuration = 300; // ms
		const spawnProgress = Math.min(1, age / spawnDuration);

		// Smooth spawn animation
		const scale = spawnProgress < 0.5
			? spawnProgress * 2 // Grow
			: 1 + (1 - spawnProgress) * 0.3; // Bounce back

		// Draw resource as a small circle with icon
		const color = resource.resourceType === 'iron' ? '#8B8B8B' : '#FF6B35';

		// Pulsing glow effect
		const pulseScale = 1 + Math.sin(age * 0.005) * 0.1;

		// Outer glow
		ctx.fillStyle = color + '40';
		ctx.beginPath();
		ctx.arc(x, y, 12 * scale * pulseScale, 0, Math.PI * 2);
		ctx.fill();

		// Main circle
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
		ctx.fill();

		// White outline
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Resource icon
		ctx.globalAlpha = spawnProgress;
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 10px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		const icon = resource.resourceType === 'iron' ? 'Fe' : 'Cu';
		ctx.fillText(icon, x, y);
		ctx.globalAlpha = 1;
	}

	function drawRobot(robot: typeof gameState.robots[0], deltaTime: number) {
		if (!ctx) return;

		// Initialize render state if needed
		if (!robotRenderStates.has(robot.id)) {
			robotRenderStates.set(robot.id, {
				x: robot.position.x,
				y: robot.position.y,
				rotation: 0
			});
		}

		const renderState = robotRenderStates.get(robot.id)!;
		const smoothing = 0.3; // Lower = smoother but more lag

		// Smooth position interpolation
		renderState.x = lerp(renderState.x, robot.position.x, smoothing);
		renderState.y = lerp(renderState.y, robot.position.y, smoothing);

		// Calculate rotation based on movement
		if (robot.targetPosition) {
			const dx = robot.targetPosition.x - robot.position.x;
			const dy = robot.targetPosition.y - robot.position.y;
			const targetRotation = Math.atan2(dy, dx);

			// Smooth rotation
			let rotationDiff = targetRotation - renderState.rotation;
			// Handle wrap-around
			if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
			if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
			renderState.rotation += rotationDiff * smoothing;
		}

		const x = renderState.x;
		const y = renderState.y;

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(renderState.rotation);

		// Robot body (circle with directional indicator)
		ctx.fillStyle = robot.status === 'error' ? '#ff4444' :
		                 robot.status === 'working' ? '#44ff44' :
		                 robot.status === 'moving' ? '#4a9eff' : '#888888';

		// Main body
		ctx.beginPath();
		ctx.arc(0, 0, 10, 0, Math.PI * 2);
		ctx.fill();

		// Directional arrow
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.moveTo(8, 0);
		ctx.lineTo(3, -3);
		ctx.lineTo(3, 3);
		ctx.closePath();
		ctx.fill();

		// Robot outline with glow
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.shadowColor = robot.status === 'moving' ? '#4a9eff' : 'transparent';
		ctx.shadowBlur = 8;
		ctx.beginPath();
		ctx.arc(0, 0, 10, 0, Math.PI * 2);
		ctx.stroke();
		ctx.shadowBlur = 0;

		ctx.restore();

		// Draw carrying indicator (world space, not rotated)
		if (robot.carrying) {
			const resourceColor = robot.carrying === 'iron' ? '#8B8B8B' : '#FF6B35';
			// Bobbing animation
			const bobOffset = Math.sin(performance.now() * 0.005) * 2;

			ctx.fillStyle = resourceColor;
			ctx.beginPath();
			ctx.arc(x, y - 15 + bobOffset, 5, 0, Math.PI * 2);
			ctx.fill();

			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 1;
			ctx.stroke();
		}

		// Draw movement path
		if (robot.targetPosition) {
			ctx.strokeStyle = '#4a9eff40';
			ctx.lineWidth = 2;
			ctx.setLineDash([8, 4]);
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(robot.targetPosition.x, robot.targetPosition.y);
			ctx.stroke();
			ctx.setLineDash([]);
		}

		// Robot ID
		ctx.fillStyle = '#ffffff';
		ctx.font = '9px monospace';
		ctx.textAlign = 'center';
		ctx.fillText(robot.id.split('-')[1], x, y + 20);
	}

	function drawMachine(machine: typeof gameState.machines[0]) {
		if (!ctx) return;

		const x = machine.position.x;
		const y = machine.position.y;

		// Machine body
		ctx.fillStyle = machine.active ? '#4a90e2' : '#666666';
		ctx.fillRect(x - 20, y - 20, 40, 40);

		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.strokeRect(x - 20, y - 20, 40, 40);

		// Progress bar
		if (machine.recipe && machine.progress > 0) {
			const progressWidth = 36 * (machine.progress / machine.recipe.productionTime);
			ctx.fillStyle = '#44ff44';
			ctx.fillRect(x - 18, y + 12, progressWidth, 4);
		}
	}

	function render(currentTime: number = performance.now()) {
		if (!ctx || !canvas) {
			requestAnimationFrame(render);
			return;
		}

		// Calculate delta time
		const deltaTime = currentTime - lastFrameTime;
		lastFrameTime = currentTime;

		// Update particles
		updateParticles(deltaTime);

		// Clean up old resource spawn times
		const currentResourceIds = new Set(gameState.spawnedResources.map(r => r.id));
		for (const id of resourceSpawnTimes.keys()) {
			if (!currentResourceIds.has(id)) {
				resourceSpawnTimes.delete(id);
			}
		}

		// Clear entire canvas BEFORE applying transform
		ctx.fillStyle = BG_COLOR;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Apply camera transform
		ctx.save();
		ctx.translate(panX, panY);
		ctx.scale(zoom, zoom);

		// Draw grid (already has background, but we cleared above)
		drawGrid();

		// Draw spawned resources
		for (const resource of gameState.spawnedResources) {
			drawSpawnedResource(resource);
		}

		// Draw machines
		for (const machine of gameState.machines) {
			drawMachine(machine);
		}

		// Draw robots and detect pickup/dropoff events
		for (const robot of gameState.robots) {
			// Check for pickup/dropoff events
			const lastState = lastRobotStates.get(robot.id);
			if (lastState) {
				// Pickup event - was not carrying, now carrying
				if (!lastState.carrying && robot.carrying) {
					const color = robot.carrying === 'iron' ? '#8B8B8B' : '#FF6B35';
					createParticles(robot.position.x, robot.position.y, color, 16);
				}
				// Dropoff event - was carrying, now not carrying
				else if (lastState.carrying && !robot.carrying) {
					const color = lastState.carrying === 'iron' ? '#8B8B8B' : '#FF6B35';
					createParticles(lastState.position.x, lastState.position.y, color, 20);
					// Add success particles too
					createParticles(lastState.position.x, lastState.position.y, '#4ade80', 12);
				}
			}

			// Update last state
			lastRobotStates.set(robot.id, {
				carrying: robot.carrying,
				position: { x: robot.position.x, y: robot.position.y }
			});

			drawRobot(robot, deltaTime);
		}

		// Draw particles on top
		drawParticles();

		// Restore transform
		ctx.restore();

		requestAnimationFrame(render);
	}

	function handleZoomIn() {
		const newZoom = Math.min(3, zoom * 1.2);
		const centerX = containerWidth / 2;
		const centerY = containerHeight / 2;

		const worldX = (centerX - panX) / zoom;
		const worldY = (centerY - panY) / zoom;

		panX = centerX - worldX * newZoom;
		panY = centerY - worldY * newZoom;
		zoom = newZoom;
	}

	function handleZoomOut() {
		const newZoom = Math.max(0.5, zoom * 0.8);
		const centerX = containerWidth / 2;
		const centerY = containerHeight / 2;

		const worldX = (centerX - panX) / zoom;
		const worldY = (centerY - panY) / zoom;

		panX = centerX - worldX * newZoom;
		panY = centerY - worldY * newZoom;
		zoom = newZoom;
	}

	function handleResetView() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}
</script>

<div class="canvas-container">
	<canvas
		bind:this={canvas}
		width={containerWidth}
		height={containerHeight}
		class="factory-canvas"
	></canvas>

	<div class="zoom-controls">
		<button class="zoom-btn" onclick={handleZoomIn} title="Zoom In">+</button>
		<button class="zoom-btn" onclick={handleResetView} title="Reset View">⊙</button>
		<button class="zoom-btn" onclick={handleZoomOut} title="Zoom Out">−</button>
		<div class="zoom-level">{Math.round(zoom * 100)}%</div>
	</div>
</div>

<style>
	.canvas-container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.factory-canvas {
		border: 2px solid #444;
		background: #1a1a1a;
		display: block;
		width: 100%;
		height: 100%;
		cursor: grab;
	}

	.factory-canvas:active {
		cursor: grabbing;
	}

	.zoom-controls {
		position: absolute;
		top: 12px;
		right: 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: rgba(26, 26, 26, 0.9);
		border: 1px solid #444;
		border-radius: 6px;
		padding: 6px;
		backdrop-filter: blur(4px);
	}

	.zoom-btn {
		width: 32px;
		height: 32px;
		background: #2a2a2a;
		border: 1px solid #555;
		border-radius: 4px;
		color: #fff;
		font-size: 18px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.zoom-btn:hover {
		background: #4a9eff;
		border-color: #4a9eff;
		transform: scale(1.05);
	}

	.zoom-btn:active {
		transform: scale(0.95);
	}

	.zoom-level {
		font-size: 11px;
		text-align: center;
		color: #888;
		font-family: 'Consolas', 'Monaco', monospace;
		padding: 2px 0;
		border-top: 1px solid #333;
		margin-top: 2px;
		padding-top: 4px;
	}
</style>

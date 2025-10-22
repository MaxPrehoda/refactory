import type { Robot, Position } from '$lib/types/game';
import { gameState } from '$lib/stores/gameState.svelte';

function distance(p1: Position, p2: Position): number {
	return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function moveTowards(current: Position, target: Position, speed: number): Position {
	const dist = distance(current, target);

	if (dist <= speed) {
		return { ...target };
	}

	const ratio = speed / dist;
	return {
		x: current.x + (target.x - current.x) * ratio,
		y: current.y + (target.y - current.y) * ratio
	};
}

export function updateRobots() {
	for (const robot of gameState.robots) {
		// Update robot movement
		if (robot.status === 'moving' && robot.targetPosition) {
			const newPosition = moveTowards(robot.position, robot.targetPosition, robot.speed);
			const dist = distance(newPosition, robot.targetPosition);

			gameState.updateRobot(robot.id, {
				position: newPosition,
				status: dist < 1 ? 'idle' : 'moving',
				targetPosition: dist < 1 ? null : robot.targetPosition
			});
		}
	}
}

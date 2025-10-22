<script lang="ts">
	import { gameState } from '$lib/stores/gameState.svelte';
	import type { Robot } from '$lib/types/game';

	// Energy upgrades
	const ENERGY_UPGRADES = [
		{
			id: 'solar-1',
			name: 'Solar Panel I',
			cost: { iron: 75, copper: 25 },
			benefit: { type: 'regen' as const, amount: 0.2 },
			description: 'Increase energy regeneration by +0.2/tick'
		},
		{
			id: 'solar-2',
			name: 'Solar Panel II',
			cost: { iron: 150, copper: 75 },
			benefit: { type: 'regen' as const, amount: 0.3 },
			description: 'Increase energy regeneration by +0.3/tick'
		},
		{
			id: 'solar-3',
			name: 'Solar Panel III',
			cost: { iron: 300, copper: 150 },
			benefit: { type: 'regen' as const, amount: 0.5 },
			description: 'Increase energy regeneration by +0.5/tick'
		},
		{
			id: 'battery-1',
			name: 'Battery Pack I',
			cost: { iron: 100, copper: 50 },
			benefit: { type: 'maxEnergy' as const, amount: 500 },
			description: 'Increase max energy by +500'
		},
		{
			id: 'battery-2',
			name: 'Battery Pack II',
			cost: { iron: 250, copper: 125 },
			benefit: { type: 'maxEnergy' as const, amount: 1000 },
			description: 'Increase max energy by +1000'
		}
	];

	// Robot performance upgrades
	const ROBOT_UPGRADES = [
		{
			id: 'speed-1',
			name: 'Velocity Module I',
			cost: { iron: 500, copper: 300, circuit: 5 },
			benefit: { type: 'speed' as const, amount: 0.5 },
			description: 'Increase all robot movement speed by +0.5'
		},
		{
			id: 'speed-2',
			name: 'Velocity Module II',
			cost: { iron: 1000, copper: 600, circuit: 15 },
			benefit: { type: 'speed' as const, amount: 1.0 },
			description: 'Increase all robot movement speed by +1.0'
		},
		{
			id: 'speed-3',
			name: 'Velocity Module III',
			cost: { iron: 2000, copper: 1200, circuit: 30 },
			benefit: { type: 'speed' as const, amount: 1.5 },
			description: 'Increase all robot movement speed by +1.5'
		}
	];

	// Storage upgrade tiers
	const STORAGE_UPGRADES = [
		{
			id: 'storage-2',
			name: 'Storage Center II',
			cost: { iron: 100, copper: 50 },
			capacity: 500,
			description: 'Expanded storage facility'
		},
		{
			id: 'storage-3',
			name: 'Storage Center III',
			cost: { iron: 250, copper: 150 },
			capacity: 1000,
			description: 'Large warehouse complex'
		},
		{
			id: 'storage-4',
			name: 'Storage Center IV',
			cost: { iron: 500, copper: 300 },
			capacity: 2000,
			description: 'Massive distribution center'
		}
	];

	// Resource trade offers
	const TRADES = [
		{
			id: 'iron-to-copper',
			name: 'Trade Iron for Copper',
			give: { resourceId: 'iron', amount: 3 },
			receive: { resourceId: 'copper', amount: 2 },
			description: '3 Iron → 2 Copper'
		},
		{
			id: 'copper-to-iron',
			name: 'Trade Copper for Iron',
			give: { resourceId: 'copper', amount: 2 },
			receive: { resourceId: 'iron', amount: 3 },
			description: '2 Copper → 3 Iron'
		},
		{
			id: 'iron-copper-to-circuit',
			name: 'Craft Circuit Board',
			give: { resourceId: 'iron', amount: 5, copper: 5 },
			receive: { resourceId: 'circuit', amount: 1 },
			description: '5 Iron + 5 Copper → 1 Circuit Board',
			requiresBoth: true
		}
	];

	let selectedTab = $state<'upgrades' | 'storage' | 'trade'>('upgrades');
	let purchasedStorages: string[] = $state([]);
	let purchasedEnergyUpgrades: string[] = $state([]);
	let purchasedRobotUpgrades: string[] = $state([]);

	function canAffordEnergyUpgrade(upgrade: typeof ENERGY_UPGRADES[0]): boolean {
		const iron = gameState.resources.get('iron');
		const copper = gameState.resources.get('copper');

		return (
			(iron?.amount || 0) >= upgrade.cost.iron &&
			(copper?.amount || 0) >= upgrade.cost.copper
		);
	}

	function purchaseEnergyUpgrade(upgrade: typeof ENERGY_UPGRADES[0]) {
		if (!canAffordEnergyUpgrade(upgrade) || purchasedEnergyUpgrades.includes(upgrade.id)) {
			return;
		}

		// Deduct resources
		gameState.removeResource('iron', upgrade.cost.iron);
		gameState.removeResource('copper', upgrade.cost.copper);

		// Apply the upgrade benefit
		if (upgrade.benefit.type === 'regen') {
			gameState.increaseEnergyRegen(upgrade.benefit.amount);
		} else if (upgrade.benefit.type === 'maxEnergy') {
			gameState.increaseMaxEnergy(upgrade.benefit.amount);
		}

		purchasedEnergyUpgrades.push(upgrade.id);
	}

	function canAffordRobotUpgrade(upgrade: typeof ROBOT_UPGRADES[0]): boolean {
		const iron = gameState.resources.get('iron');
		const copper = gameState.resources.get('copper');
		const circuit = gameState.resources.get('circuit');

		return (
			(iron?.amount || 0) >= upgrade.cost.iron &&
			(copper?.amount || 0) >= upgrade.cost.copper &&
			(circuit?.amount || 0) >= (upgrade.cost.circuit || 0)
		);
	}

	function purchaseRobotUpgrade(upgrade: typeof ROBOT_UPGRADES[0]) {
		if (!canAffordRobotUpgrade(upgrade) || purchasedRobotUpgrades.includes(upgrade.id)) {
			return;
		}

		// Deduct resources
		gameState.removeResource('iron', upgrade.cost.iron);
		gameState.removeResource('copper', upgrade.cost.copper);
		if (upgrade.cost.circuit) {
			gameState.removeResource('circuit', upgrade.cost.circuit);
		}

		// Apply the upgrade benefit - increase speed for all robots
		if (upgrade.benefit.type === 'speed') {
			for (const robot of gameState.robots) {
				robot.speed += upgrade.benefit.amount;
			}
		}

		purchasedRobotUpgrades.push(upgrade.id);
	}

	function canAffordRobot(): boolean {
		const iron = gameState.resources.get('iron');
		return (iron?.amount || 0) >= 150;
	}

	function purchaseRobot() {
		if (!canAffordRobot()) {
			return;
		}

		// Deduct resources
		gameState.removeResource('iron', 150);

		// Add the new robot
		const newRobot: Robot = {
			id: `robot-${gameState.robots.length + 1}`,
			position: { x: 100 + gameState.robots.length * 50, y: 100 },
			targetPosition: null,
			speed: 2,
			carrying: null,
			carryAmount: 0,
			status: 'idle',
			currentInstruction: null,
			energy: 100
		};

		gameState.current.robots.push(newRobot);
	}

	function canAffordStorage(upgrade: typeof STORAGE_UPGRADES[0]): boolean {
		const iron = gameState.resources.get('iron');
		const copper = gameState.resources.get('copper');

		return (
			(iron?.amount || 0) >= upgrade.cost.iron &&
			(copper?.amount || 0) >= upgrade.cost.copper
		);
	}

	function purchaseStorage(upgrade: typeof STORAGE_UPGRADES[0]) {
		if (!canAffordStorage(upgrade) || purchasedStorages.includes(upgrade.id)) {
			return;
		}

		// Deduct resources
		gameState.removeResource('iron', upgrade.cost.iron);
		gameState.removeResource('copper', upgrade.cost.copper);

		// Add the storage machine
		const newStorage = {
			id: upgrade.id,
			type: 'storage' as const,
			position: {
				x: 400 + (purchasedStorages.length + 1) * 100,
				y: 100
			},
			recipe: null,
			progress: 0,
			inventory: new Map(),
			outputInventory: new Map(),
			active: true
		};

		gameState.current.machines.push(newStorage);
		purchasedStorages.push(upgrade.id);
	}

	function canAffordTrade(trade: typeof TRADES[0]): boolean {
		if (trade.requiresBoth) {
			const iron = gameState.resources.get('iron');
			const copper = gameState.resources.get('copper');
			return (
				(iron?.amount || 0) >= (trade.give.amount || 0) &&
				(copper?.amount || 0) >= (trade.give.copper || 0)
			);
		} else {
			const resource = gameState.resources.get(trade.give.resourceId);
			return (resource?.amount || 0) >= trade.give.amount;
		}
	}

	function executeTrade(trade: typeof TRADES[0]) {
		if (!canAffordTrade(trade)) {
			return;
		}

		// Deduct resources
		if (trade.requiresBoth) {
			gameState.removeResource('iron', trade.give.amount);
			gameState.removeResource('copper', trade.give.copper || 0);
		} else {
			gameState.removeResource(trade.give.resourceId, trade.give.amount);
		}

		// Add received resources
		gameState.addResource(trade.receive.resourceId, trade.receive.amount);
	}

	function getResourceAmount(resourceId: string): number {
		return gameState.resources.get(resourceId)?.amount || 0;
	}

	function getResourceIcon(resourceId: string): string {
		return gameState.resources.get(resourceId)?.icon || '❓';
	}
</script>

<div class="marketplace">
	<div class="marketplace-header">
		<h3>🏪 Marketplace</h3>
		<div class="tabs">
			<button
				class:active={selectedTab === 'upgrades'}
				onclick={() => selectedTab = 'upgrades'}
			>
				Upgrades
			</button>
			<button
				class:active={selectedTab === 'storage'}
				onclick={() => selectedTab = 'storage'}
			>
				Storage
			</button>
			<button
				class:active={selectedTab === 'trade'}
				onclick={() => selectedTab = 'trade'}
			>
				Trade
			</button>
		</div>
	</div>

	<div class="marketplace-content">
		{#if selectedTab === 'upgrades'}
			<div class="section">
				<p class="section-description">
					Upgrade your factory's energy infrastructure
				</p>

				<!-- Current Energy Stats -->
				<div class="energy-stats">
					<div class="stat-box">
						<span class="stat-label">Max Energy</span>
						<span class="stat-value">{gameState.maxEnergy.toFixed(0)}</span>
					</div>
					<div class="stat-box">
						<span class="stat-label">Regen Rate</span>
						<span class="stat-value">+{gameState.current.energyRegenRate.toFixed(1)}/tick</span>
					</div>
				</div>

				<!-- Energy Upgrades -->
				<h4 class="subsection-title">Energy Infrastructure</h4>
				<div class="upgrades-list">
					{#each ENERGY_UPGRADES as upgrade}
						{@const isPurchased = purchasedEnergyUpgrades.includes(upgrade.id)}
						{@const canAffordUpgrade = canAffordEnergyUpgrade(upgrade)}

						<div class="upgrade-card" class:purchased={isPurchased} class:affordable={canAffordUpgrade && !isPurchased}>
							<div class="upgrade-info">
								<h4>
									{#if upgrade.benefit.type === 'regen'}
										⚡ {upgrade.name}
									{:else}
										🔋 {upgrade.name}
									{/if}
								</h4>
								<p class="upgrade-description">{upgrade.description}</p>
								<div class="upgrade-stats">
									{#if upgrade.benefit.type === 'regen'}
										<span>New total: +{(gameState.current.energyRegenRate + (isPurchased ? 0 : upgrade.benefit.amount)).toFixed(1)}/tick</span>
									{:else}
										<span>New total: {gameState.maxEnergy + (isPurchased ? 0 : upgrade.benefit.amount)}</span>
									{/if}
								</div>
							</div>
							<div class="upgrade-cost">
								<div class="cost-items">
									<span class:insufficient={getResourceAmount('iron') < upgrade.cost.iron}>
										⚙️ {upgrade.cost.iron}
									</span>
									<span class:insufficient={getResourceAmount('copper') < upgrade.cost.copper}>
										🟠 {upgrade.cost.copper}
									</span>
								</div>
								<button
									disabled={!canAffordUpgrade || isPurchased}
									onclick={() => purchaseEnergyUpgrade(upgrade)}
								>
									{isPurchased ? '✓ Purchased' : 'Buy'}
								</button>
							</div>
						</div>
					{/each}
				</div>

				<!-- Robot Performance Upgrades -->
				<h4 class="subsection-title">Robot Performance</h4>
				<div class="upgrades-list">
					{#each ROBOT_UPGRADES as upgrade}
						{@const isPurchased = purchasedRobotUpgrades.includes(upgrade.id)}
						{@const canAffordUpgrade = canAffordRobotUpgrade(upgrade)}

						<div class="upgrade-card" class:purchased={isPurchased} class:affordable={canAffordUpgrade && !isPurchased}>
							<div class="upgrade-info">
								<h4>🚀 {upgrade.name}</h4>
								<p class="upgrade-description">{upgrade.description}</p>
								<div class="upgrade-stats">
									<span>Current robot speed: {gameState.robots[0]?.speed || 2}</span>
								</div>
							</div>
							<div class="upgrade-cost">
								<div class="cost-items">
									<span class:insufficient={getResourceAmount('iron') < upgrade.cost.iron}>
										⚙️ {upgrade.cost.iron}
									</span>
									<span class:insufficient={getResourceAmount('copper') < upgrade.cost.copper}>
										🟠 {upgrade.cost.copper}
									</span>
									{#if upgrade.cost.circuit}
										<span class:insufficient={getResourceAmount('circuit') < upgrade.cost.circuit}>
											💾 {upgrade.cost.circuit}
										</span>
									{/if}
								</div>
								<button
									disabled={!canAffordUpgrade || isPurchased}
									onclick={() => purchaseRobotUpgrade(upgrade)}
								>
									{isPurchased ? '✓ Purchased' : 'Buy'}
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if selectedTab === 'storage'}
			<div class="section">
				<p class="section-description">
					Expand your factory workforce and storage capacity
				</p>

				<!-- Robot Purchase -->
				<div class="upgrades-list">
					<div class="upgrade-card robot-card" class:affordable={canAffordRobot()}>
						<div class="upgrade-info">
							<h4>🤖 Additional Robot</h4>
							<p class="upgrade-description">Purchase a new robot to expand your workforce</p>
							<div class="upgrade-stats">
								<span>Current Robots: {gameState.robots.length}</span>
							</div>
						</div>
						<div class="upgrade-cost">
							<div class="cost-items">
								<span class:insufficient={getResourceAmount('iron') < 150}>
									⚙️ 150
								</span>
							</div>
							<button
								disabled={!canAffordRobot()}
								onclick={() => purchaseRobot()}
							>
								Buy Robot
							</button>
						</div>
					</div>
				</div>

				<!-- Storage Upgrades -->
				<h4 class="subsection-title">Storage Centers</h4>
				<div class="upgrades-list">
					{#each STORAGE_UPGRADES as upgrade}
						{@const isPurchased = purchasedStorages.includes(upgrade.id)}
						{@const canAffordUpgrade = canAffordStorage(upgrade)}

						<div class="upgrade-card" class:purchased={isPurchased}>
							<div class="upgrade-info">
								<h4>{upgrade.name}</h4>
								<p class="upgrade-description">{upgrade.description}</p>
								<div class="upgrade-stats">
									<span>Capacity: {upgrade.capacity}</span>
								</div>
							</div>
							<div class="upgrade-cost">
								<div class="cost-items">
									<span class:insufficient={getResourceAmount('iron') < upgrade.cost.iron}>
										⚙️ {upgrade.cost.iron}
									</span>
									<span class:insufficient={getResourceAmount('copper') < upgrade.cost.copper}>
										🟠 {upgrade.cost.copper}
									</span>
								</div>
								<button
									disabled={!canAffordUpgrade || isPurchased}
									onclick={() => purchaseStorage(upgrade)}
								>
									{isPurchased ? '✓ Purchased' : 'Buy'}
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if selectedTab === 'trade'}
			<div class="section">
				<p class="section-description">
					Exchange resources at the trading post
				</p>
				<div class="trades-list">
					{#each TRADES as trade}
						{@const canAfford = canAffordTrade(trade)}

						<div class="trade-card" class:affordable={canAfford}>
							<div class="trade-info">
								<h4>{trade.name}</h4>
								<p class="trade-description">{trade.description}</p>
							</div>
							<div class="trade-exchange">
								<div class="trade-give">
									<span class="label">Give:</span>
									{#if trade.requiresBoth}
										<span class:insufficient={getResourceAmount('iron') < trade.give.amount}>
											⚙️ {trade.give.amount}
										</span>
										<span class:insufficient={getResourceAmount('copper') < (trade.give.copper || 0)}>
											🟠 {trade.give.copper}
										</span>
									{:else}
										<span class:insufficient={getResourceAmount(trade.give.resourceId) < trade.give.amount}>
											{getResourceIcon(trade.give.resourceId)} {trade.give.amount}
										</span>
									{/if}
								</div>
								<div class="trade-arrow">→</div>
								<div class="trade-receive">
									<span class="label">Get:</span>
									<span class="receive-amount">
										{getResourceIcon(trade.receive.resourceId)} {trade.receive.amount}
									</span>
								</div>
							</div>
							<button
								disabled={!canAfford}
								onclick={() => executeTrade(trade)}
								class="trade-button"
							>
								Trade
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.marketplace {
		background: #2a2a2a;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.marketplace-header {
		padding: 12px;
		border-bottom: 1px solid #444;
	}

	.marketplace-header h3 {
		margin: 0 0 12px 0;
		font-size: 16px;
		color: #fff;
	}

	.tabs {
		display: flex;
		gap: 8px;
	}

	.tabs button {
		flex: 1;
		padding: 8px 12px;
		background: #1e1e1e;
		border: 1px solid #444;
		border-radius: 4px;
		color: #888;
		cursor: pointer;
		font-size: 13px;
		transition: all 0.2s;
	}

	.tabs button:hover {
		background: #2a2a2a;
		border-color: #4a90e2;
	}

	.tabs button.active {
		background: #4a90e2;
		border-color: #4a90e2;
		color: #fff;
	}

	.marketplace-content {
		flex: 1;
		overflow-y: auto;
		padding: 12px;
	}

	.section-description {
		margin: 0 0 16px 0;
		font-size: 12px;
		color: #888;
	}

	.upgrades-list,
	.trades-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.upgrade-card,
	.trade-card {
		background: #1e1e1e;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 12px;
		transition: all 0.2s;
	}

	.upgrade-card:hover,
	.trade-card:hover {
		border-color: #555;
	}

	.upgrade-card.purchased {
		opacity: 0.6;
		border-color: #2a8f2a;
	}

	.upgrade-card.affordable,
	.trade-card.affordable {
		border-color: #4a90e2;
	}

	.robot-card.affordable {
		border-color: #2ecc71;
	}

	.subsection-title {
		margin: 24px 0 12px 0;
		font-size: 13px;
		color: #aaa;
		text-transform: uppercase;
		font-weight: 600;
	}

	.energy-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 16px;
		padding: 12px;
		background: #1e1e1e;
		border-radius: 4px;
		border: 1px solid #444;
	}

	.stat-box {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px;
		background: #2a2a2a;
		border-radius: 4px;
	}

	.stat-box .stat-label {
		font-size: 10px;
		color: #888;
		text-transform: uppercase;
	}

	.stat-box .stat-value {
		font-size: 18px;
		font-weight: 600;
		color: #4a90e2;
	}

	.upgrade-info h4,
	.trade-info h4 {
		margin: 0 0 4px 0;
		font-size: 14px;
		color: #fff;
	}

	.upgrade-description,
	.trade-description {
		margin: 0 0 8px 0;
		font-size: 12px;
		color: #888;
	}

	.upgrade-stats {
		font-size: 11px;
		color: #aaa;
	}

	.upgrade-cost {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid #333;
	}

	.cost-items {
		display: flex;
		gap: 12px;
		font-size: 13px;
		color: #fff;
	}

	.cost-items span.insufficient {
		color: #e74c3c;
	}

	.upgrade-cost button,
	.trade-button {
		padding: 6px 16px;
		background: #4a90e2;
		border: none;
		border-radius: 4px;
		color: #fff;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.upgrade-cost button:hover:not(:disabled),
	.trade-button:hover:not(:disabled) {
		background: #357abd;
	}

	.upgrade-cost button:disabled,
	.trade-button:disabled {
		background: #555;
		color: #888;
		cursor: not-allowed;
	}

	.trade-exchange {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 8px 0;
		font-size: 13px;
	}

	.trade-give,
	.trade-receive {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.label {
		font-size: 10px;
		color: #888;
		text-transform: uppercase;
	}

	.trade-give span:not(.label),
	.trade-receive span:not(.label) {
		color: #fff;
	}

	.trade-give span.insufficient {
		color: #e74c3c;
	}

	.receive-amount {
		color: #2ecc71 !important;
		font-weight: 600;
	}

	.trade-arrow {
		color: #4a90e2;
		font-size: 18px;
		margin: 0 4px;
	}

	.trade-button {
		width: 100%;
		margin-top: 8px;
	}
</style>

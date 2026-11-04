<script lang="ts">
	// One sector tile of the live lap card (Sprint 1.5, L1/L2): label, time and a bar in the
	// sector's pace colour. The sector in progress is outlined and stays neutral.
	import { cn } from '$lib/utils';
	import { formatLapClock } from '$lib/utils/laptime';
	import { paceBg, paceText } from '$lib/pace/classes';
	import { sectorAriaLabel } from '$lib/pace/labels';
	import type { SectorTile } from './liveLap';

	let { tile }: { tile: SectorTile } = $props();
</script>

<div
	role="group"
	aria-label={sectorAriaLabel(tile.kind, tile.pace, tile.time !== null)}
	class={cn('flex min-w-0 flex-col gap-1 rounded-lg ')}
>
	<span
		class={cn(
			'text-muted-foreground text-xs tracking-widest uppercase',
			tile.state === 'current' && 'font-semibold'
		)}
	>
		{tile.state === 'current' ? tile.kind.replace('s', 'Sector ') : tile.kind}
	</span>
	<strong
		class={cn(
			'text-md truncate font-mono font-semibold tabular-nums',
			tile.state !== 'future' ? 'text-primary' : 'text-muted-foreground'
		)}
	>
		{tile.time === null ? '-' : formatLapClock(tile.time, true)}
	</strong>
	<div
		class={cn('h-2 rounded-full', tile.state === 'future' ? 'bg-muted' : paceBg[tile.pace])}
	></div>
</div>

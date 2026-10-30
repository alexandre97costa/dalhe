<script lang="ts">
	// One sector tile of the live lap card (Sprint 1.5, L1/L2): label, time and a bar in the
	// sector's pace colour. The sector in progress is outlined and stays neutral.
	import { cn } from '$lib/utils';
	import { formatLapClock } from '$lib/utils/laptime';
	import { paceBg } from '$lib/pace/classes';
	import { sectorAriaLabel } from '$lib/pace/labels';
	import type { SectorTile } from './liveLap';

	let { tile }: { tile: SectorTile } = $props();
</script>

<div
	role="group"
	aria-label={sectorAriaLabel(tile.kind, tile.pace, tile.time !== null)}
	class={cn(
		'flex min-w-0 flex-col gap-1 rounded-lg border p-2',
		tile.state === 'current' && 'border-primary'
	)}
>
	<span class="text-muted-foreground text-xs uppercase">{tile.kind}</span>
	<strong class="truncate font-mono text-base font-semibold tabular-nums">
		{tile.time === null ? '–' : formatLapClock(tile.time)}
	</strong>
	<div
		class={cn('h-1 rounded-full', tile.state === 'future' ? 'bg-muted' : paceBg[tile.pace])}
	></div>
</div>

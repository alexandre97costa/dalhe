<script lang="ts">
	// Compact view of the session laps (Sprint 1.5, S1): lap number, time, a crown for record /
	// session best, three sector dots. No header; track and car live in the group separators.
	import type { BestsByKey, SessionLap } from '$lib/types/lounge';
	import type { LapGroup } from '$lib/lounge/groupLaps';
	import { classifyLap } from '$lib/pace';
	import { paceLabel, sectorAriaLabel } from '$lib/pace/labels';
	import { paceBg, paceText } from '$lib/pace/classes';
	import { formatLapClock } from '$lib/utils/laptime';
	import { cn } from '$lib/utils';
	import LabeledSeparator from '$lib/components/lounge/LabeledSeparator.svelte';
	import { Crown } from '@lucide/svelte';

	let { groups, bests }: { groups: LapGroup<SessionLap>[]; bests: BestsByKey } = $props();

	const sectors = [
		{ kind: 's1', time: (lap: SessionLap) => lap.s1Ms },
		{ kind: 's2', time: (lap: SessionLap) => lap.s2Ms },
		{ kind: 's3', time: (lap: SessionLap) => lap.s3Ms }
	] as const;
</script>

<div class="flex flex-col gap-1">
	{#each groups as group (group.key)}
		<LabeledSeparator label={`${group.label.track} · ${group.label.car}`} class="pt-2" />
		<ol class="flex flex-col">
			{#each group.laps as lap (lap.id)}
				{@const paces = classifyLap(lap, bests)}
				{@const crown = paces.lap === 'record' || paces.lap === 'sessionBest'}
				<li class="flex items-center gap-3 py-1.5">
					<span class="text-muted-foreground w-6 shrink-0 text-sm tabular-nums">
						{lap.lapNumber}
					</span>
					<span class="flex min-w-0 flex-1 items-center gap-1.5">
						<strong class="font-mono text-lg leading-tight font-semibold tabular-nums">
							{formatLapClock(lap.timeMs)}
						</strong>
						{#if crown}
							<span
								role="img"
								class={cn('inline-flex', paceText[paces.lap])}
								aria-label={paceLabel(paces.lap)}
								title={paceLabel(paces.lap)}
							>
								<Crown class="size-4" aria-hidden="true" />
							</span>
						{/if}
					</span>
					<span class="flex shrink-0 items-center gap-1.5">
						{#each sectors as sector (sector.kind)}
							{@const time = sector.time(lap)}
							<span
								role="img"
								class={cn(
									'size-2.5 rounded-full',
									paceBg[paces[sector.kind]],
									time === null && 'opacity-30'
								)}
								aria-label={sectorAriaLabel(sector.kind, paces[sector.kind], time !== null)}
							></span>
						{/each}
					</span>
				</li>
			{/each}
		</ol>
	{/each}
</div>

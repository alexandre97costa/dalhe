<script lang="ts">
	// Table view of the session laps (Sprint 1.5, S1): #, Time (with the pace badge under it),
	// S1 S2 S3 in coloured text on a dimmed undertone. Track and car live in the group separators.
	import type { BestsByKey, SessionLap } from '$lib/types/lounge';
	import type { LapGroup } from '$lib/lounge/groupLaps';
	import { classifyLap, hasPaceBadge } from '$lib/pace';
	import { paceAriaLabel, paceLabel } from '$lib/pace/labels';
	import { paceText, paceUndertoneBg } from '$lib/pace/classes';
	import { formatLapClock } from '$lib/utils/laptime';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import LabeledSeparator from '$lib/components/lounge/LabeledSeparator.svelte';

	let { groups, bests }: { groups: LapGroup<SessionLap>[]; bests: BestsByKey } = $props();

	const sectors = [
		{ kind: 's1', label: 'S1', time: (lap: SessionLap) => lap.s1Ms },
		{ kind: 's2', label: 'S2', time: (lap: SessionLap) => lap.s2Ms },
		{ kind: 's3', label: 'S3', time: (lap: SessionLap) => lap.s3Ms }
	] as const;
</script>

<table class="w-full border-collapse text-sm">
	<thead>
		<tr class="text-muted-foreground text-xs">
			<th scope="col" class="w-6 py-1 pr-2 text-left font-normal">{m.lounge_lap_col_number()}</th>
			<th scope="col" class="py-1 pr-2 text-left font-normal">{m.lounge_lap_col_time()}</th>
			{#each sectors as sector (sector.kind)}
				<th scope="col" class="py-1 pl-1 text-right font-normal">{sector.label}</th>
			{/each}
		</tr>
	</thead>
	{#each groups as group (group.key)}
		<tbody>
			<tr>
				<th scope="rowgroup" colspan={5} class="pt-3 pb-1 font-normal">
					<LabeledSeparator label={`${group.label.track} · ${group.label.car}`} />
				</th>
			</tr>
			{#each group.laps as lap (lap.id)}
				{@const paces = classifyLap(lap, bests)}
				<tr class="align-top">
					<td class="text-muted-foreground py-1.5 pr-2 tabular-nums">{lap.lapNumber}</td>
					<td class="py-1.5 pr-2">
						<div class="flex flex-col items-start gap-1">
							<span class="font-mono font-semibold tabular-nums">{formatLapClock(lap.timeMs)}</span>
							{#if hasPaceBadge(paces.lap)}
								<span class="flex flex-wrap gap-1">
									<span
										class={cn(
											'rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap',
											paceUndertoneBg[paces.lap],
											paceText[paces.lap]
										)}
									>
										{paceLabel(paces.lap)}
									</span>
								</span>
							{/if}
						</div>
					</td>
					{#each sectors as sector (sector.kind)}
						{@const time = sector.time(lap)}
						{@const pace = paces[sector.kind]}
						<td class="py-1.5 pl-1 text-right">
							{#if time === null}
								<span class="text-muted-foreground px-1.5 font-mono text-xs">–</span>
							{:else}
								<span
									class={cn(
										'inline-block rounded px-1.5 py-0.5 font-mono text-xs tabular-nums',
										pace !== 'neutral' && paceUndertoneBg[pace],
										paceText[pace]
									)}
								>
									{formatLapClock(time)}
									<span class="sr-only">({paceAriaLabel(pace)})</span>
								</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	{/each}
</table>

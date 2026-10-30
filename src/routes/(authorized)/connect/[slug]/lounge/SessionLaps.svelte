<script lang="ts">
	// Session laps. Owned by stream S (Sprint 1.5); data from the lounge load contract.
	// Standalone on purpose: the unclaimed list keeps LapList.svelte.
	import type { BestsByKey, SessionLap } from '$lib/types/lounge';
	import { m } from '$lib/paraglide/messages.js';
	import { formatDelta, formatLapClock } from '$lib/utils/laptime';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let {
		laps,
		bests
	}: {
		// The active session's laps, newest first (lapNumber: oldest = 1).
		laps: SessionLap[];
		// Bests by track + category: classifyLap(lap, bests) from $lib/pace.
		bests: BestsByKey;
	} = $props();

	// Sprint 1 behaviour, moved unchanged: "Best" on the fastest lap, +delta on the others.
	let best = $derived(laps.length ? Math.min(...laps.map((lap) => lap.timeMs)) : null);
</script>

<Card.Root class="gap-2 py-4">
	<Card.Header class="px-4">
		<Card.Title>{m.lounge_session_laps()}</Card.Title>
	</Card.Header>
	<Card.Content class="px-4">
		{#if laps.length > 0}
			<ol class="divide-border flex flex-col divide-y">
				{#each laps as lap (lap.id)}
					{@const delta = best === null ? null : lap.timeMs - best}
					<li class="flex items-start gap-3 py-3">
						<span class="text-muted-foreground w-6 shrink-0 pt-0.5 text-sm tabular-nums">
							{lap.lapNumber}
						</span>
						<div class="flex min-w-0 flex-1 flex-col gap-0.5">
							<div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
								<div class="flex items-baseline gap-2">
									<strong class="font-mono text-base font-semibold tabular-nums">
										{formatLapClock(lap.timeMs)}
									</strong>
									{#if delta === 0 && laps.length > 1}
										<Badge variant="outline_purple">{m.lounge_session_best()}</Badge>
									{:else if delta !== null && delta > 0}
										<span class="text-muted-foreground font-mono text-xs tabular-nums">
											{formatDelta(delta)}
										</span>
									{/if}
								</div>
								<span
									class="text-muted-foreground flex gap-3 font-mono text-xs tabular-nums sm:ml-auto"
									aria-label="S1 S2 S3"
								>
									<span>{formatLapClock(lap.s1Ms)}</span>
									<span>{formatLapClock(lap.s2Ms)}</span>
									<span>{formatLapClock(lap.s3Ms)}</span>
								</span>
							</div>
							<span class="text-muted-foreground truncate text-xs">
								{lap.trackName} · {lap.carMake}
								{lap.carModel}
							</span>
						</div>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="text-muted-foreground py-2 text-sm">{m.lounge_session_laps_empty()}</p>
		{/if}
	</Card.Content>
</Card.Root>

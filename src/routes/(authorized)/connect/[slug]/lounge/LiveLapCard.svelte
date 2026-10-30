<script lang="ts">
	// Live lap card. Owned by stream L (Sprint 1.5); data from the lounge load contract.
	import type { LapStats } from '$lib/types/rig';
	import type { BestsByKey, LatestLap, LoungeBests } from '$lib/types/lounge';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { formatDelta, formatLapClock } from '$lib/utils/laptime';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let {
		liveLap,
		liveBests,
		latestLap,
		bests,
		statsAgeMs
	}: {
		// Latest /send/live stats; null before the overlay sends them.
		liveLap: LapStats | null;
		// Bests of the live track + category; null when unmapped (sectors stay neutral).
		liveBests: LoungeBests | null;
		// Newest lap of the session with its age (freeze frame); null without laps.
		latestLap: LatestLap | null;
		// All bests by track + category, for the frozen lap: bestsFor(bests, latestLap).
		bests: BestsByKey;
		// Age of liveLap at load time (ms); null without stats.
		statsAgeMs: number | null;
	} = $props();

	let live = $derived(liveLap);

	// Sector tiles: completed sectors from the stats, the current one still running.
	// Sprint 1 behaviour, moved unchanged; stream L replaces it (classifyPace with liveBests).
	let sectors = $derived.by(() => {
		if (!live) return [];
		const done = [live.s1_ms, live.s2_ms];
		const best = [live.bestS1_ms, live.bestS2_ms, live.bestS3_ms];
		return [1, 2, 3].map((sector) => {
			const current = live.currentSector === sector;
			const completed = sector < live.currentSector ? done[sector - 1] : undefined;
			const elapsed = done
				.slice(0, sector - 1)
				.reduce<number>((total, value) => total - (value ?? 0), live.laptime_ms);
			const time = completed ?? (current ? elapsed : null);
			const bestTime = best[sector - 1];
			return {
				sector,
				current,
				time,
				fastest: completed !== undefined && bestTime !== undefined && completed <= bestTime
			};
		});
	});

	// deltaBest comes from SimHub in seconds.
	let deltaMs = $derived(live ? Math.round(live.deltaBest * 1000) : null);
</script>

<Card.Root class="gap-4 py-4" aria-label={m.lounge_live_lap()}>
	<Card.Header class="px-4">
		<Card.Description>
			{#if live}
				{live.lapTotalCount
					? m.lounge_lap_number_of({ lap: live.lapNumber, total: live.lapTotalCount })
					: m.lounge_lap_number({ lap: live.lapNumber })}
			{:else}
				{m.lounge_live_lap()}
			{/if}
		</Card.Description>
		{#if live}
			<Card.Title class="font-mono text-4xl font-bold tabular-nums">
				{formatLapClock(live.laptime_ms)}
			</Card.Title>
			<Card.Action class="flex flex-col items-end gap-1">
				{#if deltaMs !== null}
					<Badge
						variant={deltaMs < 0 ? 'outline_teal' : deltaMs > 0 ? 'destructive' : 'secondary'}
						class="font-mono text-sm tabular-nums"
					>
						{formatDelta(deltaMs)}
					</Badge>
				{/if}
				{#if !live.valid}
					<Badge variant="destructive">{m.lounge_lap_invalid()}</Badge>
				{/if}
			</Card.Action>
		{/if}
	</Card.Header>
	<Card.Content class="flex flex-col gap-4 px-4">
		{#if live}
			<Progress
				value={Math.round(Math.min(1, Math.max(0, live.progress)) * 100)}
				aria-label={m.lounge_lap_progress()}
			/>
			<div class="grid grid-cols-3 gap-2">
				{#each sectors as s (s.sector)}
					<div
						class={cn(
							'flex min-w-0 flex-col gap-1 rounded-lg border p-2',
							s.current && 'border-primary'
						)}
					>
						<span class="text-muted-foreground text-xs">S{s.sector}</span>
						<strong class="font-mono text-base font-semibold tabular-nums">
							{s.time === null ? '–' : formatLapClock(s.time)}
						</strong>
						<div
							class={cn(
								'h-1 rounded-full',
								s.fastest ? 'bg-purple-500' : s.time === null ? 'bg-muted' : 'bg-primary/40'
							)}
						></div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-muted-foreground text-sm">{m.lounge_live_lap_empty()}</p>
		{/if}
	</Card.Content>
</Card.Root>

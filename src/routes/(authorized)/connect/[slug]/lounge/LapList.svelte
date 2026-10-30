<script lang="ts">
	import type { LoungeLap } from '$lib/queries/rig';
	import { formatDelta, formatLapClock, formatTimeSinceCreation } from '$lib/utils/laptime';
	import { m } from '$lib/paraglide/messages.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	// `numbered`: session laps get a lap number and a delta to the session best.
	let { laps, numbered = false }: { laps: LoungeLap[]; numbered?: boolean } = $props();

	let best = $derived(laps.length ? Math.min(...laps.map((lap) => lap.time_milliseconds)) : null);
</script>

<ol class="divide-border flex flex-col divide-y">
	{#each laps as lap, index (lap.id)}
		{@const delta = best === null ? null : lap.time_milliseconds - best}
		<li class="flex items-start gap-3 py-3">
			{#if numbered}
				<span class="text-muted-foreground w-6 shrink-0 pt-0.5 text-sm tabular-nums">
					{laps.length - index}
				</span>
			{/if}
			<div class="flex min-w-0 flex-1 flex-col gap-0.5">
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
					<div class="flex items-baseline gap-2">
						<strong class="font-mono text-base font-semibold tabular-nums">
							{formatLapClock(lap.time_milliseconds)}
						</strong>
						{#if numbered && delta === 0 && laps.length > 1}
							<Badge variant="outline_purple">{m.lounge_session_best()}</Badge>
						{:else if numbered && delta !== null && delta > 0}
							<span class="text-muted-foreground font-mono text-xs tabular-nums">
								{formatDelta(delta)}
							</span>
						{/if}
					</div>
					<span
						class="text-muted-foreground flex gap-3 font-mono text-xs tabular-nums sm:ml-auto"
						aria-label="S1 S2 S3"
					>
						<span>{formatLapClock(lap.sector1_ms)}</span>
						<span>{formatLapClock(lap.sector2_ms)}</span>
						<span>{formatLapClock(lap.sector3_ms)}</span>
					</span>
				</div>
				<span class="text-muted-foreground truncate text-xs">
					{lap.race_track.name} · {lap.car.car_make.name}
					{lap.car.model}
					{#if !numbered}· {formatTimeSinceCreation(lap.created_at)}{/if}
				</span>
			</div>
		</li>
	{/each}
</ol>

<script lang="ts">
	// Live lap card. Owned by stream L (Sprint 1.5); data from the lounge load contract.
	// L1/L2: sector tiles (liveLap.ts), L3: invalid lap, L4: freeze frame, L5: delta colours.
	import { onDestroy, untrack } from 'svelte';
	import type { LapStats } from '$lib/types/rig';
	import type { BestsByKey, LatestLap, LoungeBests } from '$lib/types/lounge';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { formatDelta, formatLapClock } from '$lib/utils/laptime';
	import { FREEZE_DURATION_S } from '$lib/config/lounge';
	import { hasPaceBadge } from '$lib/pace';
	import { paceText, paceUndertoneBg } from '$lib/pace/classes';
	import { paceLabel } from '$lib/pace/labels';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { frozenLap, liveSectorTiles, shouldFreeze } from './liveLap';
	import SectorTile from './SectorTile.svelte';
	import ShowLiveLapButton from './ShowLiveLapButton.svelte';

	let {
		liveLap,
		liveBests,
		latestLap,
		bests
	}: {
		// Latest /send/live stats; null before the overlay sends them.
		liveLap: LapStats | null;
		// Bests of the live track + category; null when unmapped (sectors stay neutral).
		liveBests: LoungeBests | null;
		// Newest lap of the session with its age (freeze frame); null without laps.
		latestLap: LatestLap | null;
		// All bests by track + category, for the frozen lap.
		bests: BestsByKey;
		// Age of liveLap at load time (ms); in the contract, not used by the card yet.
		statsAgeMs: number | null;
	} = $props();

	// Freeze frame (Decision 5). Laps this page view already froze on (then dismissed or
	// expired): component state, so a Refresh (invalidateAll, the card stays mounted) doesn't
	// replay them. Marked when the freeze starts, so a Refresh mid-freeze doesn't restart it.
	const seen = new Set<number>();
	let frozen = $state<LatestLap | null>(null);
	let remainingS = $state(FREEZE_DURATION_S);
	let endTimer: ReturnType<typeof setTimeout> | undefined;
	let tickTimer: ReturnType<typeof setInterval> | undefined;

	// Decided once synchronously too, so the server render already shows the frozen lap.
	untrack(() => {
		if (latestLap && shouldFreeze(latestLap, seen)) {
			seen.add(latestLap.id);
			frozen = latestLap;
		}
	});

	function stopTimers() {
		clearTimeout(endTimer);
		clearInterval(tickTimer);
		endTimer = tickTimer = undefined;
	}

	function unfreeze() {
		stopTimers();
		frozen = null;
	}

	// The countdown runs on the client, from mount or from the Refresh that brought the lap.
	function startTimers() {
		stopTimers();
		const endsAt = Date.now() + FREEZE_DURATION_S * 1000;
		remainingS = FREEZE_DURATION_S;
		tickTimer = setInterval(() => {
			remainingS = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
		}, 250);
		endTimer = setTimeout(unfreeze, FREEZE_DURATION_S * 1000);
	}

	$effect(() => {
		const lap = latestLap;
		untrack(() => {
			if (frozen && lap?.id === frozen.id) {
				// Same lap (first run after mount, or a Refresh mid-freeze): keep the countdown.
				frozen = lap;
				if (!endTimer) startTimers();
			} else if (lap && shouldFreeze(lap, seen)) {
				seen.add(lap.id);
				frozen = lap;
				startTimers();
			}
		});
	});

	onDestroy(stopTimers);

	let frozenView = $derived(frozen ? frozenLap(frozen, bests) : null);

	let live = $derived(liveLap);
	let liveTiles = $derived(live ? liveSectorTiles(live, liveBests) : []);

	// deltaBest comes from SimHub in seconds.
	let deltaMs = $derived(live ? Math.round(live.deltaBest * 1000) : null);
</script>

<Card.Root class="gap-4 py-4" aria-label={m.lounge_live_lap()} aria-live="polite">
	{#if frozen && frozenView}
		<Card.Header class="px-4">
			<Card.Description>{m.lounge_lap_number({ lap: frozen.lapNumber })}</Card.Description>
			<Card.Title class="font-mono text-4xl font-bold tabular-nums">
				{formatLapClock(frozen.timeMs)}
			</Card.Title>
			{#if hasPaceBadge(frozenView.pace)}
				<Card.Action>
					<Badge
						variant="outline"
						class={cn(
							'border-transparent',
							paceUndertoneBg[frozenView.pace],
							paceText[frozenView.pace]
						)}
					>
						{paceLabel(frozenView.pace)}
					</Badge>
				</Card.Action>
			{/if}
		</Card.Header>
		<Card.Content class="flex flex-col gap-4 px-4">
			<Progress value={100} aria-label={m.lounge_lap_progress()} />
			<div class="grid grid-cols-3 gap-2">
				{#each frozenView.sectors as tile (tile.kind)}
					<SectorTile {tile} />
				{/each}
			</div>
			{#key frozen.id}
				<ShowLiveLapButton durationS={FREEZE_DURATION_S} {remainingS} onclick={unfreeze} />
			{/key}
		</Card.Content>
	{:else}
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
				<Card.Title
					class={cn('font-mono text-4xl font-bold tabular-nums', !live.valid && 'text-lap-invalid')}
				>
					{formatLapClock(live.laptime_ms)}
				</Card.Title>
				<Card.Action class="flex flex-col items-end gap-1">
					{#if deltaMs !== null}
						<Badge
							variant={deltaMs === 0 ? 'secondary' : 'outline'}
							class={cn(
								'font-mono text-sm tabular-nums',
								deltaMs < 0 && 'border-delta-faster text-delta-faster',
								deltaMs > 0 && 'border-delta-slower text-delta-slower'
							)}
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
					{#each liveTiles as tile (tile.kind)}
						<SectorTile {tile} />
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-sm">{m.lounge_live_lap_empty()}</p>
			{/if}
		</Card.Content>
	{/if}
</Card.Root>

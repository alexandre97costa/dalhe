<script lang="ts">
	import type { PageProps } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { formatDelta, formatLapClock, formatTimeSinceCreation } from '$lib/utils/laptime';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { ArrowLeft, ChevronDown, Flag, RefreshCw, Timer, User } from '@lucide/svelte';
	import LapList from './LapList.svelte';

	let { data }: PageProps = $props();

	let refreshing = $state(false);
	let sessionOpen = $state(true);

	let status = $derived(data.status);
	let sim = $derived(data.simSession);
	let live = $derived(data.liveLap);

	$effect(() => {
		title.set(m.lounge_title({ rigName: data.rig.name }));
	});

	async function refresh() {
		refreshing = true;
		try {
			await invalidateAll();
		} finally {
			refreshing = false;
		}
	}

	// SimHub ids (brands_hatch, audi_r8_lms_evo) read well enough with spaces and capitals.
	// Rain values keep SimHub's raw strings (ACC_NO_RAIN) in the data; only the badge drops ACC_.
	function humanize(id: string | number | null | undefined): string | null {
		if (id === null || id === undefined) return null;
		if (id === 8) return 'Superpole';
		if (id === 7) return 'Hotstint';
		return String(id)
			.toLowerCase()
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Sector tiles: completed sectors from the stats, the current one still running.
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

<main class="mx-auto flex w-full max-w-xl flex-col gap-4 pb-8">
	<header class="flex items-center gap-2">
		<Button
			href={`/connect/${data.rig.id}`}
			variant="ghost"
			size="icon"
			aria-label={m.rig_connect_title({ rigName: data.rig.name })}
		>
			<ArrowLeft />
		</Button>
		<div class="flex min-w-0 flex-1 flex-col gap-0.5">
			<h1 class="truncate text-2xl leading-tight font-bold tracking-tight">{data.rig.name}</h1>
			<p class="text-muted-foreground flex items-center gap-1.5 truncate text-sm">
				<User class="size-3.5 shrink-0" />
				{#if !status.session_active}
					{m.lounge_no_session_title()}
				{:else if data.isDriver}
					{m.lounge_you_are_driving()}
				{:else if status.driver_name}
					{m.rig_connect_driving({ driverName: status.driver_name })}
				{:else}
					{m.lounge_anonymous_driver()}
				{/if}
			</p>
		</div>
		<Button variant="outline" size="sm" onclick={refresh} disabled={refreshing}>
			<RefreshCw data-icon="inline-start" class={cn(refreshing && 'animate-spin')} />
			{m.lounge_refresh()}
		</Button>
	</header>

	{#if !status.session_active}
		<Empty.Root class="border">
			<Empty.Header>
				<Empty.Media variant="icon"><Flag /></Empty.Media>
				<Empty.Title>{m.lounge_no_session_title()}</Empty.Title>
				<Empty.Description>{m.lounge_no_session_description()}</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button href={`/connect/${data.rig.id}`} variant="cta">{m.rig_connect_to_rig()}</Button>
			</Empty.Content>
		</Empty.Root>
	{:else}
		{#if data.latestLap}
			{@const lap = data.latestLap}
			<Alert.Root>
				<Timer />
				<Alert.Title class="flex items-baseline gap-2">
					{m.lounge_new_lap()}
					<span class="font-mono text-base font-bold tabular-nums">
						{formatLapClock(lap.time_milliseconds)}
					</span>
				</Alert.Title>
				<Alert.Description>
					{lap.driver?.username ?? m.lounge_anonymous_driver()} · {lap.race_track.name} ·
					{formatTimeSinceCreation(lap.created_at)}
				</Alert.Description>
			</Alert.Root>
		{/if}

		<Collapsible.Root bind:open={sessionOpen}>
			<Card.Root class="gap-3 py-4">
				<Card.Header class="px-4">
					<Card.Description>{m.lounge_sim_session()}</Card.Description>
					{#if sim}
						<Card.Title class="text-xl">{humanize(sim.TrackId)}</Card.Title>
						<Card.Action>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										variant="ghost"
										size="icon-sm"
										aria-label={m.lounge_sim_session()}
									>
										<ChevronDown class={cn('transition-transform', sessionOpen && 'rotate-180')} />
									</Button>
								{/snippet}
							</Collapsible.Trigger>
						</Card.Action>
					{/if}
				</Card.Header>
				<Card.Content class="flex flex-wrap gap-1.5 px-4">
					{#if sim}
						<Badge variant="secondary">{humanize(sim.CarId)}</Badge>
						{#if sim.CarClass}<Badge variant="outline">{sim.CarClass}</Badge>{/if}
						<Collapsible.Content class="contents">
							<Badge variant="outline">{humanize(sim.SessionTypeName)}</Badge>
							<Badge variant="outline">TC {sim.TCLevel}</Badge>
							<Badge variant="outline">ABS {sim.ABSLevel}</Badge>
							<Badge variant="outline">BB {sim.BrakeBias}</Badge>
							<Badge variant="outline">{m.lounge_air_temp({ temp: sim.AirTemperature })}</Badge>
							<Badge variant="outline">{m.lounge_track_temp({ temp: sim.TrackTemperature })}</Badge>
							<Badge variant="outline">{humanize(sim.rainIntesity.replace(/^ACC_/, ''))}</Badge>
						</Collapsible.Content>
					{:else}
						<p class="text-muted-foreground text-sm">{m.lounge_sim_session_empty()}</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</Collapsible.Root>

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

		<Card.Root class="gap-2 py-4">
			<Card.Header class="px-4">
				<Card.Title>{m.lounge_session_laps()}</Card.Title>
			</Card.Header>
			<Card.Content class="px-4">
				{#if data.sessionLaps.length > 0}
					<LapList laps={data.sessionLaps} numbered />
				{:else}
					<p class="text-muted-foreground py-2 text-sm">{m.lounge_session_laps_empty()}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root class="gap-2 py-4">
		<Card.Header class="px-4">
			<Card.Title>{m.lounge_unclaimed_laps()}</Card.Title>
			<Card.Description>{m.lounge_unclaimed_laps_description()}</Card.Description>
		</Card.Header>
		<Card.Content class="px-4">
			{#if data.unclaimedLaps.length > 0}
				<LapList laps={data.unclaimedLaps} />
			{:else}
				<p class="text-muted-foreground py-2 text-sm">{m.lounge_unclaimed_laps_empty()}</p>
			{/if}
		</Card.Content>
	</Card.Root>
</main>

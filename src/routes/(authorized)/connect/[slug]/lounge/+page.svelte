<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { formatLaptime } from '$lib/utils/laptime';
	import type { Json } from '$lib/types/supabase.types';
	import { Activity, ChevronDown, Clock3, Radio, UserRound, Power } from '@lucide/svelte';

	let { data }: PageProps = $props();
	let rigStats = $state(data.rigStats);
	let selectedLapIds = $state<string[]>([]);
	let sessionStatsOpen = $state(true);
	let liveLapOpen = $state(true);
	let previousLapsOpen = $state(true);

	type PreviewLap = {
		id: string;
		lapNumber: number;
		track: string;
		car: string;
		timeMilliseconds: number;
	};

	const unclaimedLaps: PreviewLap[] = import.meta.env.DEV
		? [
				{
					id: 'preview-lap-1',
					lapNumber: 12,
					track: 'Example circuit',
					car: 'Example car',
					timeMilliseconds: 91_620
				},
				{
					id: 'preview-lap-2',
					lapNumber: 13,
					track: 'Example circuit',
					car: 'Example car',
					timeMilliseconds: 90_845
				}
			]
		: [];

	$effect(() => {
		rigStats = data.rigStats;
	});

	onMount(() => {
		// const channel = data.supabase
		// 	.channel(`rig-stats:${data.rigId}`)
		// 	.on(
		// 		'postgres_changes',
		// 		{
		// 			event: 'UPDATE',
		// 			schema: 'public',
		// 			table: 'rig_stats',
		// 			filter: `id=eq.${data.rigId}`
		// 		},
		// 		({ new: updatedStats }) => {
		// 			rigStats = updatedStats;
		// 		}
		// 	)
		// 	.subscribe((status, error) => {
		// 		if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
		// 			console.error(`Rig stats subscription failed for ${data.rigId}:`, error);
		// 		}
		// 	});
		// return () => {
		// 	void data.supabase.removeChannel(channel);
		// };
	});

	function asRecord(value: Json | null | undefined): Record<string, Json | undefined> | null {
		if (
			value === null ||
			value === undefined ||
			typeof value !== 'object' ||
			Array.isArray(value)
		) {
			return null;
		}
		return value;
	}

	function readText(record: Record<string, Json | undefined> | null, key: string): string | null {
		const value = record?.[key];
		return typeof value === 'string' ? value : null;
	}

	function readNumber(record: Record<string, Json | undefined> | null, key: string): number | null {
		const value = record?.[key];
		return typeof value === 'number' && Number.isFinite(value) ? value : null;
	}

	function formatBroadcastTime(seconds: number | null): string {
		if (seconds === null) return '--:--.---';

		const milliseconds = Math.max(0, Math.round(seconds * 1000));
		const minutes = Math.floor(milliseconds / 60_000);
		const remainingSeconds = Math.floor((milliseconds % 60_000) / 1000);
		const remainingMilliseconds = milliseconds % 1000;

		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMilliseconds
			.toString()
			.padStart(3, '0')}`;
	}

	function toggleLap(id: string, checked: boolean) {
		selectedLapIds = checked
			? [...selectedLapIds, id]
			: selectedLapIds.filter((selectedId) => selectedId !== id);
	}

	let sessionStats = $derived(asRecord(rigStats?.session_stats));
	let lapStats = $derived(asRecord(rigStats?.lap_stats));
	let sectorTimes = $derived(asRecord(lapStats?.sectorTimes));
	let currentLapTime = $derived(readNumber(lapStats, 'currentLapTime'));
	let lapProgress = $derived(readNumber(lapStats, 'lapProgress'));
	let deltaToBest = $derived(
		currentLapTime !== null && data.bestLap !== null ? currentLapTime * 1000 - data.bestLap : null
	);
</script>

<svelte:head>
	<title>{data.rig.name} | Rig room</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-6">
	<header class="flex flex-row items-stretch justify-between gap-2">
		<div class="flex flex-col gap-1">
			<p class="lh-1 text-muted-foreground/50 text-sm">Cockpit Lounge</p>
			<h1 class="text-4xl font-semibold tracking-tight">{data.rig.name}</h1>
		</div>
		<!-- 
		<div class="flex flex-col text-end">
			<p class="lh-1 text-muted-foreground/50 text-sm">Now driving:</p>
            <h1 class="text-sm font-normal">{data.rig?.profiles?.username ?? 'Unknown Driver'}</h1>
			<div class="hidden relative flex items-center gap-2 border py-1 px-3 rounded-md bg-muted/50">
				<span class="relative flex size-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
					></span>
					<span class="relative inline-flex size-2 rounded-full bg-green-500"></span>
				</span>
			</div>
		</div> -->
	</header>

	<nav aria-label="Rig room views" class="bg-muted flex w-full gap-1 rounded-lg p-1 sm:w-fit">
		<a
			id="live-session-tab"
			href="?tab=live-session"
			aria-current={data.activeTab === 'live-session' ? 'page' : undefined}
			aria-controls="live-session-panel"
			class="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors sm:flex-none"
			class:bg-background={data.activeTab === 'live-session'}
			class:text-foreground={data.activeTab === 'live-session'}
			class:text-muted-foreground={data.activeTab !== 'live-session'}
			class:shadow-sm={data.activeTab === 'live-session'}
		>
			<!-- <Power size=16 class="text-muted-foreground/50" /> -->
			<span class="relative flex size-3">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
				></span>
				<span class="relative inline-flex size-3 rounded-full bg-red-500"></span>
			</span>
			Live Session
		</a>
		<a
			id="unclaimed-laps-tab"
			href="?tab=unclaimed-laps"
			aria-current={data.activeTab === 'unclaimed-laps' ? 'page' : undefined}
			aria-controls="unclaimed-laps-panel"
			class="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors sm:flex-none"
			class:bg-background={data.activeTab === 'unclaimed-laps'}
			class:text-foreground={data.activeTab === 'unclaimed-laps'}
			class:text-muted-foreground={data.activeTab !== 'unclaimed-laps'}
			class:shadow-sm={data.activeTab === 'unclaimed-laps'}
		>
			<Clock3 size="16" />
			Unclaimed Laps
		</a>
	</nav>

	{#if data.activeTab === 'live-session'}
		<section id="live-session-panel" aria-labelledby="live-session-tab" class="flex flex-col gap-6">
			<Card.Root>
				<Collapsible.Root bind:open={sessionStatsOpen}>
					<Card.Header>
						<Collapsible.Trigger class="group flex w-full items-center justify-between text-left">
							<Card.Title class="flex items-center gap-2">
								<Radio />
								Session stats
							</Card.Title>
							<ChevronDown
								class="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
							/>
						</Collapsible.Trigger>
					</Card.Header>
					<Collapsible.Content>
						<Card.Description class="px-6 pb-0">
							What the rig is currently broadcasting.
						</Card.Description>
						<Card.Content class="grid gap-6 sm:grid-cols-3">
							<div class="flex flex-col gap-1">
								<span class="text-muted-foreground text-sm">Race track</span>
								<span class="font-medium"
									>{readText(sessionStats, 'trackName') ?? 'Waiting for rig data'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class="text-muted-foreground text-sm">Car used</span>
								<span class="font-medium">{readText(sessionStats, 'carName') ?? '—'}</span>
							</div>
							<div class="flex flex-col gap-1">
								<span class="text-muted-foreground text-sm">Who's driving</span>
								<span class="flex items-center gap-2 font-medium">
									<UserRound />
									{data.rig.profiles?.username ?? 'No driver connected'}
								</span>
							</div>
							{#if readText(sessionStats, 'weather') || readNumber(sessionStats, 'trackTemperature') !== null}
								<div
									class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm sm:col-span-3"
								>
									{#if readText(sessionStats, 'weather')}
										<span>{readText(sessionStats, 'weather')}</span>
									{/if}
									{#if readNumber(sessionStats, 'trackTemperature') !== null}
										<span>{readNumber(sessionStats, 'trackTemperature')}° track</span>
									{/if}
								</div>
							{/if}
						</Card.Content>
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Root>

			<Card.Root>
				<Collapsible.Root bind:open={liveLapOpen}>
					<Card.Header>
						<Collapsible.Trigger class="group flex w-full items-center justify-between text-left">
							<Card.Title class="flex items-center gap-2">
								<Activity />
								Live lap
							</Card.Title>
							<ChevronDown
								class="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
							/>
						</Collapsible.Trigger>
					</Card.Header>
					<Collapsible.Content>
						<Card.Description class="px-6 pb-0">
							Lap {readNumber(lapStats, 'lapNumber') ?? '—'}
							{#if rigStats?.lap_updated_at}
								<span> · Updated {rigStats.lap_updated_at.slice(11, 19)} UTC</span>
							{/if}
						</Card.Description>
						<Card.Content class="flex flex-col gap-6">
							<div class="grid gap-5 sm:grid-cols-2">
								<div class="flex flex-col gap-1">
									<span class="text-muted-foreground text-sm">Current lap time</span>
									<strong class="font-mono text-4xl font-semibold tabular-nums">
										{formatBroadcastTime(currentLapTime)}
									</strong>
								</div>
								<div class="flex flex-col gap-1 sm:items-end">
									<span class="text-muted-foreground text-sm">Delta to rig best</span>
									<strong
										class="font-mono text-3xl font-semibold tabular-nums"
										class:text-green-500={deltaToBest !== null && deltaToBest < 0}
										class:text-destructive={deltaToBest !== null && deltaToBest > 0}
									>
										{deltaToBest === null
											? '—'
											: `${deltaToBest > 0 ? '+' : deltaToBest < 0 ? '−' : ''}${(Math.abs(deltaToBest) / 1000).toFixed(3)}s`}
									</strong>
									<span class="text-muted-foreground text-xs">
										{data.bestLap === null
											? 'No completed rig laps yet'
											: `Best ${formatLaptime(data.bestLap)}`}
									</span>
								</div>
							</div>

							<div class="flex flex-col gap-2">
								<div class="text-muted-foreground flex justify-between text-xs">
									<span>Lap progress</span>
									<span>{lapProgress === null ? '—' : `${Math.round(lapProgress * 100)}%`}</span>
								</div>
								<progress
									class="bg-muted accent-primary h-2 w-full overflow-hidden rounded-full"
									value={lapProgress === null ? 0 : Math.min(1, Math.max(0, lapProgress))}
									max="1"
									aria-label="Lap progress"
								></progress>
							</div>

							<div class="grid grid-cols-3 gap-3">
								{#each [1, 2, 3] as sector}
									<div
										class="bg-muted/50 flex min-w-0 flex-col items-center gap-2 rounded-lg border p-4 text-center"
									>
										<span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
											Sector {sector}
										</span>
										<strong class="font-mono text-lg tabular-nums sm:text-xl">
											{formatBroadcastTime(readNumber(sectorTimes, String(sector)))}
										</strong>
										{#if readNumber(lapStats, 'currentSector') === sector}
											<span class="text-primary text-xs">Current sector</span>
										{:else}
											<span class="text-muted-foreground text-xs">
												{readNumber(sectorTimes, String(sector)) === null
													? 'Awaiting time'
													: 'Complete'}
											</span>
										{/if}
									</div>
								{/each}
							</div>
						</Card.Content>
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Root>

			<Card.Root>
				<Collapsible.Root bind:open={previousLapsOpen}>
					<Card.Header>
						<Collapsible.Trigger class="group flex w-full items-center justify-between text-left">
							<Card.Title>Previous laps</Card.Title>
							<ChevronDown
								class="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
							/>
						</Collapsible.Trigger>
					</Card.Header>
					<Collapsible.Content>
						<Card.Description class="px-6 pb-0">
							The latest completed laps recorded by this rig.
						</Card.Description>
						<Card.Content>
							{#if data.previousLaps.length > 0}
								<ol class="flex flex-col divide-y">
									{#each data.previousLaps as lap, index (lap.id)}
										<li class="flex items-center justify-between gap-4 py-3">
											<div class="flex flex-col gap-1">
												<span class="font-medium">Lap {data.previousLaps.length - index}</span>
												<time class="text-muted-foreground text-sm" datetime={lap.created_at}>
													{lap.created_at.slice(0, 16).replace('T', ' ')} UTC
												</time>
											</div>
											<strong class="font-mono text-lg tabular-nums">
												{formatLaptime(lap.time_milliseconds)}
											</strong>
										</li>
									{/each}
								</ol>
							{:else}
								<p class="text-muted-foreground py-8 text-center text-sm">
									No completed laps have been recorded for this rig yet.
								</p>
							{/if}
						</Card.Content>
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Root>
		</section>
	{:else}
		<section
			id="unclaimed-laps-panel"
			aria-labelledby="unclaimed-laps-tab"
			class="flex flex-col gap-4"
		>
			<Card.Root>
				<Card.Header>
					<Card.Title>Unclaimed laps</Card.Title>
					<Card.Description>Select laps to claim for your driver profile.</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					{#if import.meta.env.DEV}
						<p class="text-muted-foreground text-xs">
							Preview rows only — lap claiming is not connected yet.
						</p>
					{/if}

					{#if unclaimedLaps.length > 0}
						<ul class="flex flex-col divide-y">
							{#each unclaimedLaps as lap (lap.id)}
								<li class="flex items-center gap-4 py-3">
									<input
										type="checkbox"
										class="border-input accent-primary size-4 rounded"
										checked={selectedLapIds.includes(lap.id)}
										onchange={(event) => toggleLap(lap.id, event.currentTarget.checked)}
										aria-label={`Select lap ${lap.lapNumber}`}
									/>
									<div class="flex min-w-0 flex-1 flex-col gap-1">
										<span class="truncate font-medium">Lap {lap.lapNumber}</span>
										<span class="text-muted-foreground truncate text-sm">
											{lap.track} · {lap.car}
										</span>
									</div>
									<strong class="font-mono tabular-nums">
										{formatLaptime(lap.timeMilliseconds)}
									</strong>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-muted-foreground py-8 text-center text-sm">
							There are no unclaimed laps to show.
						</p>
					{/if}

					<div
						class="flex flex-col items-start gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<p class="text-muted-foreground text-sm">
							{selectedLapIds.length} selected
						</p>
						<Button disabled>Claim selected laps</Button>
					</div>
					<p class="text-muted-foreground text-xs">
						Claiming will be enabled when laps can be marked as unclaimed in the database.
					</p>
				</Card.Content>
			</Card.Root>
		</section>
	{/if}
</main>

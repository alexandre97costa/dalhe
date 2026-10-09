<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Marker from '$lib/components/ui/marker/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { cn } from '$lib/utils';
	import { formatLaptime } from '$lib/utils/laptime';
	import type { Json } from '$lib/types/supabase.types';
	import { ArrowLeft, ChevronDown, Sun } from '@lucide/svelte';
	import PreviousLaps from './PreviousLaps.svelte';

	let { data }: PageProps = $props();
	let rigStats = $state(data.rigStats);
	let selectedLapIds = $state<string[]>([]);
	let sessionStatsOpen = $state(true);
	let currentTime = $state(Date.now());

	type PreviewLap = {
		id: string;
		lapNumber: number;
		track: string;
		car: string;
		timeMilliseconds: number;
	};

	type LiveLapCardData = {
		lapNumber: number | null;
		lapTimeSeconds: number | null;
		deltaMilliseconds: number | null;
		progress: number | null;
		currentSector: number | null;
		sectorTimes: Record<string, number | null>;
		isPreview: boolean;
	};

	const previewLiveLapCard: LiveLapCardData = {
		lapNumber: 7,
		lapTimeSeconds: 81.067,
		deltaMilliseconds: -230,
		progress: 0.76,
		currentSector: 3,
		sectorTimes: {
			'1': 34.102,
			'2': 40.912,
			'3': 6.053
		},
		isPreview: true
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
		const statusInterval = window.setInterval(() => {
			currentTime = Date.now();
		}, 15_000);

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

		return () => window.clearInterval(statusInterval);
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
	let currentLapNumber = $derived(readNumber(lapStats, 'lapNumber'));
	let deltaToBest = $derived(
		currentLapTime !== null && data.bestLap !== null ? currentLapTime * 1000 - data.bestLap : null
	);
	let liveLapCard: LiveLapCardData = $derived(
		currentLapTime === null
			? previewLiveLapCard
			: {
					lapNumber: currentLapNumber,
					lapTimeSeconds: currentLapTime,
					deltaMilliseconds: deltaToBest,
					progress: lapProgress,
					currentSector: readNumber(lapStats, 'currentSector'),
					sectorTimes: {
						'1': readNumber(sectorTimes, '1'),
						'2': readNumber(sectorTimes, '2'),
						'3': readNumber(sectorTimes, '3')
					},
					isPreview: false
				}
	);
	let telemetryConnected = $derived.by(() => {
		const updatedAt = rigStats?.lap_updated_at ?? rigStats?.session_updated_at;
		if (!updatedAt) return false;
		const age = currentTime - Date.parse(updatedAt);
		return Number.isFinite(age) && age >= 0 && age < 90_000;
	});
</script>

<svelte:head>
	<title>{data.rig.name} | Rig room</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-[36rem] flex-col gap-4 pb-8 text-[#f4f2f8]">
	<header class="flex items-center gap-3">
		<a
			href="../"
			aria-label="Back to rig"
			class="flex size-8 shrink-0 items-center justify-center rounded-full text-[#e8e6ee] transition-colors hover:bg-white/10"
		>
			<ArrowLeft size={20} />
		</a>
		<div class="min-w-0 flex-1">
			<h1 class="text-2xl leading-none font-bold tracking-tight">Lounge</h1>
			<p class="mt-1 flex items-center gap-1.5 truncate text-sm text-[#a6a4b8]">
				<span
					class="size-2 shrink-0 rounded-full"
					class:bg-[#43df83]={telemetryConnected}
					class:bg-[#777586]={!telemetryConnected}
				></span>
				<span class="truncate"
					>{data.rig.name} · {telemetryConnected ? 'Connected' : 'Waiting for rig'}</span
				>
			</p>
		</div>
	</header>

	<nav aria-label="Rig room views" class="flex w-full border-b border-[#292833]">
		<a
			id="live-session-tab"
			href="?tab=live-session"
			aria-current={data.activeTab === 'live-session' ? 'page' : undefined}
			aria-controls="live-session-panel"
			class="flex min-h-10 flex-1 items-center justify-center border-b-2 px-2 text-sm font-semibold transition-colors"
			class:border-[#bd55ff]={data.activeTab === 'live-session'}
			class:border-transparent={data.activeTab !== 'live-session'}
			class:text-[#f4f2f8]={data.activeTab === 'live-session'}
			class:text-[#a6a4b8]={data.activeTab !== 'live-session'}
		>
			Live session
		</a>
		<a
			id="unclaimed-laps-tab"
			href="?tab=unclaimed-laps"
			aria-current={data.activeTab === 'unclaimed-laps' ? 'page' : undefined}
			aria-controls="unclaimed-laps-panel"
			class="flex min-h-10 flex-1 items-center justify-center gap-2 border-b-2 px-2 text-sm font-semibold transition-colors"
			class:border-[#bd55ff]={data.activeTab === 'unclaimed-laps'}
			class:border-transparent={data.activeTab !== 'unclaimed-laps'}
			class:text-[#f4f2f8]={data.activeTab === 'unclaimed-laps'}
			class:text-[#a6a4b8]={data.activeTab !== 'unclaimed-laps'}
		>
			Unclaimed
			<span
				class="flex size-5 items-center justify-center rounded-full bg-[#a947f1] text-xs font-bold text-[#160b20]"
			>
				{unclaimedLaps.length}
			</span>
		</a>
	</nav>

	{#if data.activeTab === 'live-session'}
		<section id="live-session-panel" aria-labelledby="live-session-tab" class="flex flex-col gap-4">
			<Collapsible.Root bind:open={sessionStatsOpen}>
				<div class="overflow-hidden rounded-2xl border border-[#454451] bg-[#13131b]">
					<Collapsible.Trigger
						class="group flex w-full items-center justify-between px-4 pt-4 pb-3 text-left"
					>
						<span class="text-sm font-semibold tracking-wide text-[#a6a4b8] uppercase">
							Session info
						</span>
						<ChevronDown
							size={18}
							class="text-[#a6a4b8] transition-transform group-data-[state=open]:rotate-180"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content class="px-4 pb-4">
						<div class="mb-4">
							<p class="mb-0.5 text-sm font-bold tracking-wider text-[#d5a2ff] uppercase">
								{readText(sessionStats, 'sessionType') ?? 'Live session'}
							</p>
							<h2 class="text-3xl leading-none font-bold tracking-tight">
								{readText(sessionStats, 'trackName') ?? 'Waiting for track'}
							</h2>
						</div>
						<div class="grid grid-cols-2 gap-2.5">
							<div
								class="flex min-w-0 flex-col gap-0.5 rounded-xl border border-[#454451] bg-[#0e0e14] p-2.5"
							>
								<span class="text-sm text-[#a6a4b8]">Car</span>
								<strong class="truncate text-base font-semibold">
									{readText(sessionStats, 'carName') ?? 'Waiting for car'}
								</strong>
								{#if readText(sessionStats, 'carClass')}
									<span class="text-[#a6a4b8]">
										{readText(sessionStats, 'carClass')}
									</span>
								{/if}
							</div>
							<div
								class="flex min-w-0 flex-col gap-0.5 rounded-xl border border-[#454451] bg-[#0e0e14] p-2.5"
							>
								<span class="text-sm text-[#a6a4b8]">Driver</span>
								<strong class="truncate text-base font-semibold">
									{data.rig.profiles?.username ??
										(data.rig.profiles?.id ? 'Driver' : 'No driver connected')}
								</strong>
								<span class="text-[#a6a4b8]">
									{data.rig.profiles?.id && data.rig.profiles.id === data.session?.user.id
										? 'You'
										: data.rig.profiles?.id
											? 'Rig driver'
											: 'Not connected'}
								</span>
							</div>
						</div>
						<div class="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[#a6a4b8]">
							<Sun size={16} />
							{#if readText(sessionStats, 'weather')}
								<span>{readText(sessionStats, 'weather')}</span>
							{/if}
							{#if readNumber(sessionStats, 'airTemperature') !== null}
								<span>· Air {readNumber(sessionStats, 'airTemperature')}°C</span>
							{/if}
							{#if readNumber(sessionStats, 'trackTemperature') !== null}
								<span>· Track {readNumber(sessionStats, 'trackTemperature')}°C</span>
							{/if}
							{#if !readText(sessionStats, 'weather') && readNumber(sessionStats, 'trackTemperature') === null && readNumber(sessionStats, 'airTemperature') === null}
								<span>Conditions unavailable</span>
							{/if}
						</div>
					</Collapsible.Content>
				</div>
			</Collapsible.Root>

			<section
				aria-label="Live lap"
				class="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-[#0868d3] via-[#23369e] to-[#3a0066] p-[18px]"
			>
				<div class="flex items-end justify-between gap-2">
					<div class="min-w-0 flex-1">
						<p
							class="mb-1.5 flex items-center gap-2 text-base font-bold tracking-wide text-white/75 uppercase"
						>
							Lap {liveLapCard.lapNumber ?? '—'}
							{#if liveLapCard.isPreview}
								<span
									class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] tracking-normal text-white/80 normal-case"
								>
									Preview
								</span>
							{/if}
						</p>
						<strong
							class="font-mono text-3xl leading-none font-bold tracking-tight whitespace-nowrap text-white tabular-nums sm:text-4xl"
						>
							{formatBroadcastTime(liveLapCard.lapTimeSeconds)}
						</strong>
					</div>
					<div class="flex shrink-0 flex-col items-end gap-1">
						<strong
							class={cn(
								'rounded-lg px-2 py-0.5 font-mono text-xl font-bold tabular-nums',
								liveLapCard.deltaMilliseconds !== null && liveLapCard.deltaMilliseconds < 0
									? 'bg-[#42df80] text-[#12683a]'
									: liveLapCard.deltaMilliseconds !== null && liveLapCard.deltaMilliseconds > 0
										? 'bg-[#ff6767] text-[#651d25]'
										: 'bg-white/20 text-white'
							)}
						>
							{liveLapCard.deltaMilliseconds === null
								? '—'
								: `${liveLapCard.deltaMilliseconds > 0 ? '+' : ''}${(liveLapCard.deltaMilliseconds / 1000).toFixed(3)}`}
						</strong>
						<span class="text-xs font-semibold whitespace-nowrap text-white/90">
							{liveLapCard.isPreview
								? 'sample delta'
								: data.bestLap === null
									? 'No rig best yet'
									: 'vs rig best'}
						</span>
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<div class="flex justify-end text-xs text-white/75">
						<span>
							{liveLapCard.progress === null
								? 'Waiting for progress'
								: `${Math.round(liveLapCard.progress * 100)}%`}
						</span>
					</div>
					<div
						role="progressbar"
						aria-label="Lap progress"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={liveLapCard.progress === null
							? 0
							: Math.round(Math.min(1, Math.max(0, liveLapCard.progress)) * 100)}
						class="h-2 overflow-hidden rounded-full bg-white/25"
					>
						<div
							class="h-full rounded-full bg-white transition-[width]"
							style={`width: ${liveLapCard.progress === null ? 0 : Math.min(1, Math.max(0, liveLapCard.progress)) * 100}%`}
						></div>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-2">
					{#each [1, 2, 3] as sector}
						{@const isCurrentSector = liveLapCard.currentSector === sector}
						{@const sectorTime = liveLapCard.sectorTimes[String(sector)]}
						<div
							class="flex min-w-0 flex-col gap-1 rounded-2xl border-2 bg-[#120d20]/90 p-2.5"
							class:border-[#24d9cc]={isCurrentSector && sector !== 3}
							class:border-[#252231]={!isCurrentSector}
							class:border-white={isCurrentSector && sector === 3}
						>
							<span class="text-xs font-semibold text-white/65">
								S{sector}{isCurrentSector ? ' · now' : ''}
							</span>
							<strong class="font-mono text-lg font-bold tabular-nums">
								{formatBroadcastTime(sectorTime)}
							</strong>
							<div
								class={cn(
									'h-1 rounded-full',
									sector === 1 ? 'bg-[#c879ff]' : sector === 2 ? 'bg-[#ffd326]' : 'bg-white/20'
								)}
							></div>
						</div>
					{/each}
				</div>
			</section>

			<PreviousLaps laps={data.previousLaps} bestLap={data.bestLap} />
		</section>
	{:else}
		<section
			id="unclaimed-laps-panel"
			aria-labelledby="unclaimed-laps-tab"
			class="flex flex-col gap-4"
		>
			<Marker.Root class="py-2">
				<Marker.Content class="text-foreground font-medium">Unclaimed laps</Marker.Content>
			</Marker.Root>
			<p class="text-muted-foreground text-sm">Select laps to claim for your driver profile.</p>
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

			<Separator />
			<div
				class="flex flex-col items-start gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between"
			>
				<p class="text-muted-foreground text-sm">{selectedLapIds.length} selected</p>
				<Button disabled>Claim selected laps</Button>
			</div>
			<p class="text-muted-foreground text-xs">
				Claiming will be enabled when laps can be marked as unclaimed in the database.
			</p>
		</section>
	{/if}
</main>

<script lang="ts">
	// Sim session card. Owned by stream C (Sprint 1.5); data from the lounge load contract.
	// Collapsed: one line, "{Session type} at {Track} · {Make Model}" (C1). Expanded: Session,
	// Car, Setup and Conditions sections (C2). "Updated n min ago" when the stats are stale (C3).
	import type { Component } from 'svelte';
	import type { SessionStats } from '$lib/types/rig';
	import type { SimMapping } from '$lib/types/lounge';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { rainLabel, rainLevel, sessionTypeLabel } from '$lib/utils/simhub';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Marker from '$lib/components/ui/marker/index.js';
	import TachometerStat from './TachometerStat.svelte';
	import {
		ChevronDown,
		Clock,
		CloudDrizzle,
		CloudLightning,
		CloudRain,
		CloudRainWind,
		Sun,
		Thermometer
	} from '@lucide/svelte';
	import {
		assistLevel,
		readSessionCardOpen,
		staleMinutes,
		writeSessionCardOpen
	} from './session-card';

	let {
		simSession,
		simMapping,
		statsAgeMs
	}: {
		// Latest /send/session stats; null before the overlay sends them.
		simSession: SessionStats | null;
		// TrackId / CarId mapped to the catalog, with fallback labels. Null when simSession is.
		simMapping: SimMapping | null;
		// Age of simSession at load time (ms); null without stats. Stale past STATS_STALE_AFTER_S.
		statsAgeMs: number | null;
	} = $props();

	// Weather icon per rainLevel (0 = no rain … 5 = thunderstorm).
	const RAIN_ICONS: Component[] = [
		Sun,
		CloudDrizzle,
		CloudRain,
		CloudRain,
		CloudRainWind,
		CloudLightning
	];
	// Icon color per rainLevel (0 = sun … 5 = thunderstorm )
	const RAIN_COLORS: string[] = [
		'dark:text-amber-200 text-amber-500',
		'dark:text-sky-300 text-sky-300',
		'dark:text-sky-500 text-sky-500',
		'dark:text-blue-500 text-blue-500',
		'dark:text-blue-500 text-blue-500',
		'dark:text-violet-200 text-violet-200'
	];

	function storage(): Storage | null {
		try {
			return window.localStorage;
		} catch {
			return null;
		}
	}

	// Collapsed on the server and until the stored choice is read (Decision 9).
	let open = $state(false);
	onMount(() => {
		open = readSessionCardOpen(storage());
	});

	function onOpenChange(value: boolean) {
		writeSessionCardOpen(storage(), value);
	}

	function assistValue(level: number): string {
		const value = assistLevel(level);
		if (value === null) return '-';
		return value === 'off' ? m.lounge_setup_off() : String(value);
	}

	let sessionType = $derived(simSession ? sessionTypeLabel(simSession.SessionTypeName) : '');
	let line = $derived(
		simMapping ? `${m.lounge_session_line({ sessionType, track: simMapping.labels.track })}` : ''
	);
	let staleMin = $derived(staleMinutes(statsAgeMs));

	let setup = $derived(
		simSession
			? [
					// Short labels fit three columns on a phone; the full name is the abbreviation's title.
					{
						label: m.lounge_setup_tc_short(),
						title: m.lounge_setup_tc(),
						value: assistValue(simSession.TCLevel)
					},
					{
						label: m.lounge_setup_abs(),
						title: m.lounge_setup_abs(),
						value: assistValue(simSession.ABSLevel)
					},
					{
						label: m.lounge_setup_bb_short(),
						title: m.lounge_setup_bb(),
						value: String(simSession.BrakeBias ?? '-')
					}
				]
			: []
	);

	// rainIntensity may be missing in stats stored before the rename: rainLabel/rainLevel give null.
	let rain = $derived(
		simSession
			? [
					{ when: m.lounge_rain_now(), value: simSession.rainIntensity },
					{ when: m.lounge_rain_in_10(), value: simSession.rainIntensityIn10min },
					{ when: m.lounge_rain_in_30(), value: simSession.rainIntensityIn30min }
				].map(({ when, value }) => {
					const level = rainLevel(value);
					return {
						when,
						label: rainLabel(value) ?? '-',
						Icon: level === null ? null : RAIN_ICONS[level],
						color: level === null ? null : RAIN_COLORS[level]
					};
				})
			: []
	);
</script>

<Collapsible.Root bind:open {onOpenChange}>
	<Card.Root class="gap-2 py-2 shadow-none">
		{#if simSession && simMapping}
			<Collapsible.Trigger
				aria-label={open ? m.lounge_session_collapse() : m.lounge_session_expand()}
			>
				<Card.Header class="flex items-center justify-between gap-2 pr-2 pl-4">
					<Card.Title class={cn(' transition-all', !open ? 'truncate' : '')} title={line}>
						{m.lounge_session_line({ sessionType, track: simMapping.labels.track })}
					</Card.Title>
					<span
						class={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'shrink-0')}
						aria-hidden="true"
					>
						<ChevronDown
							class={cn('text-muted-foreground size-5 transition-transform', open && 'rotate-180')}
						/>
					</span>
				</Card.Header>
			</Collapsible.Trigger>
			<Collapsible.Content>
				<Card.Content class="flex flex-col gap-4 px-4">
					<section class="contents">
						<Marker.Root variant="separator">
							<Marker.Content>{m.lounge_section_car()}</Marker.Content>
						</Marker.Root>
						<p
							class="flex min-w-0 flex-wrap items-center justify-center gap-2 text-2xl font-bold tracking-tight"
						>
							<span class="min-w-0 wrap-break-word">{simMapping.labels.car}</span>
							{#if simMapping.labels.category}
								<Badge variant="ghost">{simMapping.labels.category}</Badge>
							{/if}
						</p>
						<dl class="grid grid-cols-3 gap-4">
							{#each setup as item (item.label)}
								<TachometerStat value={item.value} label={item.label} isBB={item.label == 'BB'} />
							{/each}
						</dl>
					</section>

					<section class="contents">
						<Marker.Root variant="separator">
							<Marker.Content>{m.lounge_section_conditions()}</Marker.Content>
						</Marker.Root>
						<dl class="grid grid-cols-3 gap-4">
							{#each rain as item (item.when)}
								<div class="flex min-w-0 flex-col items-center gap-2">
									<dt class="text-muted-foreground truncate text-xs">{item.when}</dt>
									<dd class="flex min-w-0 flex-col items-center gap-2 text-sm">
										{#if item.Icon}
											<item.Icon class={cn('mt-2 size-8', item.color)} aria-hidden="true" />
										{/if}
										<span class="max-w-full wrap-break-word">{item.label}</span>
									</dd>
								</div>
							{/each}
						</dl>
					</section>

					<section class="contents">
						<Marker.Root variant="separator">
							<Marker.Content>{m.lounge_section_temperature()}</Marker.Content>
						</Marker.Root>
						<div class="flex justify-evenly gap-2">
							<div class="flex min-w-0 flex-col items-center gap-2">
								<dt class="text-muted-foreground truncate text-xs">{m.lounge_air_temp()}</dt>
								<dd class="flex min-w-0 items-center gap-2 text-lg">
									<Thermometer class="text-muted-foreground size-6 shrink-0" aria-hidden="true" />
									<span class="max-w-full wrap-break-word">{simSession.AirTemperature + 'ºC'}</span>
								</dd>
							</div>
							<div class="flex min-w-0 flex-col items-center gap-2">
								<dt class="text-muted-foreground truncate text-xs">{m.lounge_track_temp()}</dt>
								<dd class="flex min-w-0 items-center gap-2 text-lg">
									<Thermometer class="text-muted-foreground size-6 shrink-0" aria-hidden="true" />
									<span class="max-w-full wrap-break-word">{simSession.AirTemperature + 'ºC'}</span>
								</dd>
							</div>
						</div>
					</section>

					{#if staleMin !== null}
						<p class="text-muted-foreground mt-3 flex items-center justify-center gap-2 text-xs">
							<Clock class="size-3 shrink-0" aria-hidden="true" />
							{m.lounge_stats_updated_ago({ minutes: staleMin })}
						</p>
					{/if}
				</Card.Content>
			</Collapsible.Content>
		{:else}
			<Card.Header class="px-4 pt-2">
				<Card.Title>{m.lounge_sim_session()}</Card.Title>
			</Card.Header>
			<Card.Content class="px-4 pb-1">
				<p class="text-muted-foreground text-sm">{m.lounge_sim_session_empty()}</p>
			</Card.Content>
		{/if}
	</Card.Root>
</Collapsible.Root>

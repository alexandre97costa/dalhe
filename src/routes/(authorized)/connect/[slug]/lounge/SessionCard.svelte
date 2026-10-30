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
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import LabeledSeparator from '$lib/components/lounge/LabeledSeparator.svelte';
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
		if (value === null) return '–';
		return value === 'off' ? m.lounge_setup_off() : String(value);
	}

	let sessionType = $derived(simSession ? sessionTypeLabel(simSession.SessionTypeName) : '');
	let line = $derived(
		simMapping
			? `${m.lounge_session_line({ sessionType, track: simMapping.labels.track })} · ${simMapping.labels.car}`
			: ''
	);
	let staleMin = $derived(staleMinutes(statsAgeMs));

	let setup = $derived(
		simSession
			? [
					{ label: m.lounge_setup_tc(), value: assistValue(simSession.TCLevel) },
					{ label: m.lounge_setup_abs(), value: assistValue(simSession.ABSLevel) },
					{ label: m.lounge_setup_bb(), value: String(simSession.BrakeBias ?? '–') }
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
						label: rainLabel(value) ?? '–',
						Icon: level === null ? null : RAIN_ICONS[level]
					};
				})
			: []
	);
</script>

<Collapsible.Root bind:open {onOpenChange}>
	<Card.Root class="gap-3 py-4">
		{#if simSession && simMapping}
			<Card.Header class="flex items-center gap-2 px-4">
				<div class="flex min-w-0 flex-1 flex-col gap-1">
					<Card.Title class="truncate leading-normal" title={line}>{line}</Card.Title>
					{#if staleMin !== null}
						<p class="text-muted-foreground flex items-center gap-1.5 text-xs">
							<Clock class="size-3 shrink-0" aria-hidden="true" />
							{m.lounge_stats_updated_ago({ minutes: staleMin })}
						</p>
					{/if}
				</div>
				<Collapsible.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon-sm"
							class="shrink-0"
							aria-label={open ? m.lounge_session_collapse() : m.lounge_session_expand()}
						>
							<ChevronDown class={cn('transition-transform', open && 'rotate-180')} />
						</Button>
					{/snippet}
				</Collapsible.Trigger>
			</Card.Header>
			<Collapsible.Content>
				<Card.Content class="flex flex-col gap-4 px-4">
					<section class="flex flex-col gap-1.5">
						<LabeledSeparator label={m.lounge_section_session()} />
						<div class="flex flex-col">
							<span class="text-muted-foreground text-sm">{sessionType}</span>
							<span class="font-semibold">{simMapping.labels.track}</span>
						</div>
					</section>

					<section class="flex flex-col gap-1.5">
						<LabeledSeparator label={m.lounge_section_car()} />
						<p class="flex min-w-0 flex-wrap items-center gap-2 font-semibold">
							<span class="min-w-0 break-words">{simMapping.labels.car}</span>
							{#if simMapping.labels.category}
								<Badge variant="outline">{simMapping.labels.category}</Badge>
							{/if}
						</p>
					</section>

					<section class="flex flex-col gap-1.5">
						<LabeledSeparator label={m.lounge_section_setup()} />
						<dl class="grid grid-cols-3 gap-2">
							{#each setup as item (item.label)}
								<div class="flex min-w-0 flex-col">
									<dt class="text-muted-foreground truncate text-xs">{item.label}</dt>
									<dd class="font-semibold tabular-nums">{item.value}</dd>
								</div>
							{/each}
						</dl>
					</section>

					<section class="flex flex-col gap-1.5">
						<LabeledSeparator label={m.lounge_section_conditions()} />
						<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
							<span class="flex items-center gap-1.5">
								<Thermometer class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
								{m.lounge_air_temp({ temp: simSession.AirTemperature })}
							</span>
							<span class="flex items-center gap-1.5">
								<Thermometer class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
								{m.lounge_track_temp({ temp: simSession.TrackTemperature })}
							</span>
						</div>
						<dl class="grid grid-cols-3 gap-2 pt-1">
							{#each rain as item (item.when)}
								<div class="flex min-w-0 flex-col gap-1">
									<dt class="text-muted-foreground truncate text-xs">{item.when}</dt>
									<dd class="flex min-w-0 flex-col items-start gap-1 text-sm">
										{#if item.Icon}
											<item.Icon class="size-5 shrink-0" aria-hidden="true" />
										{/if}
										<span class="max-w-full break-words">{item.label}</span>
									</dd>
								</div>
							{/each}
						</dl>
					</section>
				</Card.Content>
			</Collapsible.Content>
		{:else}
			<Card.Header class="px-4">
				<Card.Description>{m.lounge_sim_session()}</Card.Description>
			</Card.Header>
			<Card.Content class="px-4">
				<p class="text-muted-foreground text-sm">{m.lounge_sim_session_empty()}</p>
			</Card.Content>
		{/if}
	</Card.Root>
</Collapsible.Root>

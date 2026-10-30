<script lang="ts">
	// Sim session card. Owned by stream C (Sprint 1.5); data from the lounge load contract.
	import type { SessionStats } from '$lib/types/rig';
	import type { SimMapping } from '$lib/types/lounge';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { rainLabel, sessionTypeLabel } from '$lib/utils/simhub';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { ChevronDown } from '@lucide/svelte';

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

	let open = $state(true);
	let rain = $derived(simSession ? rainLabel(simSession.rainIntensity) : null);
</script>

<Collapsible.Root bind:open>
	<Card.Root class="gap-3 py-4">
		<Card.Header class="px-4">
			<Card.Description>{m.lounge_sim_session()}</Card.Description>
			{#if simSession && simMapping}
				<Card.Title class="text-xl">{simMapping.labels.track}</Card.Title>
				<Card.Action>
					<Collapsible.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" size="icon-sm" aria-label={m.lounge_sim_session()}>
								<ChevronDown class={cn('transition-transform', open && 'rotate-180')} />
							</Button>
						{/snippet}
					</Collapsible.Trigger>
				</Card.Action>
			{/if}
		</Card.Header>
		<Card.Content class="flex flex-wrap gap-1.5 px-4">
			{#if simSession && simMapping}
				<Badge variant="secondary">{simMapping.labels.car}</Badge>
				{#if simSession.CarClass}<Badge variant="outline">{simSession.CarClass}</Badge>{/if}
				<Collapsible.Content class="contents">
					<Badge variant="outline">{sessionTypeLabel(simSession.SessionTypeName)}</Badge>
					<Badge variant="outline">TC {simSession.TCLevel}</Badge>
					<Badge variant="outline">ABS {simSession.ABSLevel}</Badge>
					<Badge variant="outline">BB {simSession.BrakeBias}</Badge>
					<Badge variant="outline">{m.lounge_air_temp({ temp: simSession.AirTemperature })}</Badge>
					<Badge variant="outline">
						{m.lounge_track_temp({ temp: simSession.TrackTemperature })}
					</Badge>
					{#if rain}<Badge variant="outline">{rain}</Badge>{/if}
				</Collapsible.Content>
			{:else}
				<p class="text-muted-foreground text-sm">{m.lounge_sim_session_empty()}</p>
			{/if}
		</Card.Content>
	</Card.Root>
</Collapsible.Root>

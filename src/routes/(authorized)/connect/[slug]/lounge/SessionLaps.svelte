<script lang="ts">
	// Session laps. Owned by stream S (Sprint 1.5); data from the lounge load contract.
	// Standalone on purpose: the unclaimed list keeps LapList.svelte.
	// Two views (S1), two sorts (S2), track/car separators (S3); view and sort persist per viewer
	// in localStorage (Decision 9).
	import { onMount } from 'svelte';
	import type { BestsByKey, SessionLap } from '$lib/types/lounge';
	import { groupLaps, type LapSort } from '$lib/lounge/groupLaps';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { List, Table } from '@lucide/svelte';
	import SessionLapsCompact from './SessionLapsCompact.svelte';
	import SessionLapsTable from './SessionLapsTable.svelte';

	type LapView = 'compact' | 'table';

	let {
		laps,
		bests
	}: {
		// The active session's laps, newest first (lapNumber: oldest = 1).
		laps: SessionLap[];
		// Bests by track + category: classifyLap(lap, bests) from $lib/pace.
		bests: BestsByKey;
	} = $props();

	const VIEW_KEY = 'dalhe.lounge.lapsView';
	const SORT_KEY = 'dalhe.lounge.lapsSort';

	let view = $state<LapView>('compact');
	let sort = $state<LapSort>('recent');

	let groups = $derived(groupLaps(laps, sort));

	// Storage can be missing or throw (private mode, blocked site data): fall back to the defaults.
	function readChoice<T extends string>(key: string, allowed: readonly T[]): T | null {
		try {
			const value = localStorage.getItem(key);
			return allowed.find((option) => option === value) ?? null;
		} catch {
			return null;
		}
	}

	function writeChoice(key: string, value: string) {
		try {
			localStorage.setItem(key, value);
		} catch {
			// Not persisted; the choice still applies to this page view.
		}
	}

	// Read on mount: the server renders the defaults, the stored choice applies on hydration.
	onMount(() => {
		view = readChoice(VIEW_KEY, ['compact', 'table'] as const) ?? view;
		sort = readChoice(SORT_KEY, ['recent', 'fastest'] as const) ?? sort;
	});

	function setView(next: LapView) {
		view = next;
		writeChoice(VIEW_KEY, next);
	}

	function setSort(next: LapSort) {
		sort = next;
		writeChoice(SORT_KEY, next);
	}

	const views = [
		{ value: 'compact', icon: List, label: () => m.lounge_lap_view_compact() },
		{ value: 'table', icon: Table, label: () => m.lounge_lap_view_table() }
	] as const;

	const sorts = [
		{ value: 'recent', label: () => m.lounge_lap_sort_recent() },
		{ value: 'fastest', label: () => m.lounge_lap_sort_fastest() }
	] as const;
</script>

<Card.Root class="gap-2 py-4">
	<Card.Header class="px-4">
		<Card.Title>{m.lounge_session_laps()}</Card.Title>
		{#if laps.length > 0}
			<div class="-ml-2 flex gap-1" role="group" aria-label={m.lounge_lap_sort_label()}>
				{#each sorts as option (option.value)}
					<button
						type="button"
						class={cn(
							'rounded-sm px-2 py-0.5 text-xs transition-colors outline-none',
							'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
							sort === option.value
								? 'text-foreground font-medium'
								: 'text-muted-foreground hover:text-foreground'
						)}
						aria-pressed={sort === option.value}
						onclick={() => setSort(option.value)}
					>
						{option.label()}
					</button>
				{/each}
			</div>
			<Card.Action>
				<div class="flex gap-0.5" role="group" aria-label={m.lounge_lap_view_label()}>
					{#each views as option (option.value)}
						<Button
							variant={view === option.value ? 'secondary' : 'ghost'}
							size="icon-sm"
							aria-label={option.label()}
							aria-pressed={view === option.value}
							onclick={() => setView(option.value)}
						>
							<option.icon />
						</Button>
					{/each}
				</div>
			</Card.Action>
		{/if}
	</Card.Header>
	<Card.Content class="px-4">
		{#if laps.length > 0}
			{#if view === 'table'}
				<SessionLapsTable {groups} {bests} />
			{:else}
				<SessionLapsCompact {groups} {bests} />
			{/if}
		{:else}
			<p class="text-muted-foreground py-2 text-sm">{m.lounge_session_laps_empty()}</p>
		{/if}
	</Card.Content>
</Card.Root>

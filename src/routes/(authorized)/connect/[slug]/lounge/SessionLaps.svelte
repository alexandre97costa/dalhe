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
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { List, Logs, Rows3, Table, Clock, Zap } from '@lucide/svelte';
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

	let view = $state<LapView>('table');
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
		view = readChoice(VIEW_KEY, ['table', 'compact'] as const) ?? view;
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
		{ value: 'table', icon: Rows3, label: () => m.lounge_lap_view_table() },
		{ value: 'compact', icon: Logs, label: () => m.lounge_lap_view_compact() }
	] as const;

	const sorts = [
		{ value: 'recent', icon: Clock, label: () => m.lounge_lap_sort_recent() },
		{ value: 'fastest', icon: Zap, label: () => m.lounge_lap_sort_fastest() }
	] as const;
</script>

<Card.Root class="gap-2 py-4">
	<Card.Header class="flex justify-between px-4">
		<Card.Title>{m.lounge_session_laps()}</Card.Title>
	</Card.Header>
	<Card.Content class="px-4">
		{#if laps.length > 0}
			<div class="flex flex-col gap-2 pt-2 pb-6 sm:flex-row sm:items-center sm:justify-between">
				<div
					class="bg-card grid flex-1 grid-cols-2 gap-1 rounded-full border"
					role="group"
					aria-label={m.lounge_lap_sort_label()}
				>
					{#each sorts as option (option.value)}
						<Button
							type="button"
							class={cn(
								'h-8 gap-3 rounded-2xl text-xs',
								sort === option.value
									? 'text-foreground bg-muted hover:bg-muted-foreground/30! font-semibold'
									: 'text-foreground/90 hover:text-foreground font-normal'
							)}
							variant="ghost"
							size="sm"
							aria-pressed={sort === option.value}
							onclick={() => setSort(option.value)}
						>
							<option.icon />
							{option.label()}
						</Button>
					{/each}
				</div>

				<div
					class="bg-card grid flex-1 grid-cols-2 gap-1 rounded-full border"
					role="group"
					aria-label={m.lounge_lap_sort_label()}
				>
					{#each views as option (option.value)}
						<Button
							type="button"
							class={cn(
								'h-7 gap-3 rounded-2xl text-xs',
								view === option.value
									? 'text-foreground bg-muted hover:bg-muted-foreground/30! font-semibold'
									: 'text-foreground/90 hover:text-foreground font-normal'
							)}
							variant="ghost"
							size="sm"
							aria-pressed={view === option.value}
							onclick={() => setView(option.value)}
						>
							<option.icon class="rotate-180" />
							{option.label()}
						</Button>
					{/each}
				</div>
			</div>
			{#if view === 'table'}
				<SessionLapsTable {groups} {bests} />
			{:else}
				<SessionLapsCompact {groups} {bests} />
			{/if}
		{:else}
			<p class="text-muted-foreground text-sm">{m.lounge_session_laps_empty()}</p>
		{/if}
	</Card.Content>
</Card.Root>

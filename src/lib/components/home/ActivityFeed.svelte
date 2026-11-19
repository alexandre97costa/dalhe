<script lang="ts">
	// The homepage Activity feed: page 1 comes from the load, Load more appends the next page
	// (keyset cursor, ?/loadMore). When the load reruns (coming back to the tab), the fresh
	// page 1 is merged on top so pages already loaded stay (mergeFirstPage). Laps of one stint
	// (session, track, car) show as one item, grouped over everything loaded (groupActivity).
	import type { ActivityPage } from '$lib/types/home';
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { groupActivity, mergeFirstPage } from '$lib/utils/activity';
	import ActivityItem from './ActivityItem.svelte';

	let { activity }: { activity: ActivityPage } = $props();

	let feed = $state<ActivityPage>(untrack(() => activity));
	let seen = untrack(() => activity);
	$effect.pre(() => {
		const fresh = activity;
		if (fresh === seen) return;
		seen = fresh;
		feed = mergeFirstPage(
			untrack(() => feed),
			fresh
		);
	});

	const groups = $derived(groupActivity(feed.laps));

	let loading = $state(false);
</script>

<section aria-labelledby="home-activity-title">
	<div class="bg-background sticky top-[57px] z-10 py-2">
		<h2
			id="home-activity-title"
			class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
		>
			{m.home_activity_title()}
		</h2>
	</div>

	{#if feed.laps.length > 0}
		<Accordion.Root type="single" class="flex flex-col gap-5">
			{#each groups as group (group.key)}
				<ActivityItem {group} />
			{/each}
		</Accordion.Root>
	{:else}
		<div
			class="bg-card flex flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-10 text-center"
		>
			<span class="text-foreground text-base font-medium tracking-tight">
				{m.home_no_laptimes()}
			</span>
			<span class="text-muted-foreground text-sm">{m.home_no_laptimes_description()}</span>
		</div>
	{/if}

	{#if feed.nextCursor}
		<form
			method="POST"
			action="?/loadMore"
			class="mt-5"
			use:enhance={() => {
				loading = true;
				// No update(): the default would invalidateAll and reload page 1.
				return async ({ result }) => {
					loading = false;
					if (result.type === 'success' && result.data) {
						const next = result.data as ActivityPage;
						const known = new Set(feed.laps.map((lap) => lap.lapId));
						feed = {
							laps: [...feed.laps, ...next.laps.filter((lap) => !known.has(lap.lapId))],
							nextCursor: next.nextCursor
						};
					} else {
						toast.error(m.activity_load_more_error());
					}
				};
			}}
		>
			<input type="hidden" name="createdAt" value={feed.nextCursor.createdAt} />
			<input type="hidden" name="lapId" value={feed.nextCursor.lapId} />
			<Button type="submit" variant="outline" class="w-full" disabled={loading}>
				{#if loading}<Spinner />{/if}
				{m.activity_load_more()}
			</Button>
		</form>
	{/if}
</section>

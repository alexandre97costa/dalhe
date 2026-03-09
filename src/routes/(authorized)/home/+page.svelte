<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { RecentLaptime } from '$lib/types/listings';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	import { Button } from '$lib/components/ui/button/index.js';
	import RecentEntry from '$lib/components/leaderboards/recent_entry.svelte';
	import { type Icon as IconType, SlidersHorizontal } from '@lucide/svelte';

	title.set(m.nav_home());

	let { data } = $props();

	let showFilters = $state(false);
</script>

{#if showFilters}
<div class=" flex items-center justify-between sticky top-[57px]  bg-background py-2 mb-1">
	<div class="flex flex-1 flex-col">
		<span class="text-foreground text-xl font-medium tracking-tight"
			>{m.home_recent_laptimes()}</span
		>
		<!-- <span class="text-muted-foreground text-sm">{m.home_recent_laptimes_description()}</span> -->
	</div>
	<Button variant="outline">
		Filters
		<SlidersHorizontal class="ml-1" size="16" strokeWidth="2" />
	</Button>
</div>
{/if}

<div class="flex flex-col gap-4">
	{#each data.laptimes as laptime}
		<RecentEntry {laptime} />
	{:else}
		<div class="flex flex-col items-center justify-center py-40">
			<span class="text-foreground text-lg font-medium tracking-tight">
				{m.home_no_laptimes()}
			</span>
			<span class="text-muted-foreground text-sm">
				{m.home_no_laptimes_description()}
			</span>
		</div>
	{/each}
</div>

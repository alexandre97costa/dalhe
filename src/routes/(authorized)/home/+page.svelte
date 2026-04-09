<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { RecentLaptime } from '$lib/types/listings';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Separator } from "$lib/components/ui/separator/index.js";
	import RecentEntry from '$lib/components/leaderboards/recent_entry.svelte';
	import { type Icon as IconType, SlidersHorizontal, CircleUserRound, ListFilter, Swords } from '@lucide/svelte';

	title.set(m.nav_home());

	let { data } = $props();

	let showFilters = $state(false);
</script>

{#if showFilters}
	<div class=" bg-background sticky top-[57px] mb-1 flex items-center justify-between py-2">
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

<Accordion.Root type="single" class="flex w-full flex-col gap-4" value="">
	{#each data.laptimes as laptime, index}
		<Accordion.Item value={'item-' + index} class="not-last:border-b-0">
			<!-- Tem um accordion trigger lá dentro -->
			<RecentEntry {laptime} />

			<Accordion.Content class="border bg-card border-t-0 rounded-b-md flex flex-col gap-3 px-3 py-3 ">
				<a class="no-underline! text-muted-foreground hover:text-foreground flex gap-2 items-center pointer-events-none" href="/driver/{laptime.driver}" >
					<CircleUserRound class="" size="16" strokeWidth="2" />
					{m.laptime_options_goto_driver()}
				</a>
				<Separator class="" />
				<a class="no-underline! text-muted-foreground hover:text-foreground flex gap-2 pointer-events-none" href="/teste">
					<ListFilter class="rotate-180" size="16" strokeWidth="2" />
					{m.laptime_options_goto_leaderboard()}
				</a>
				<Separator class="" />
				<a class="no-underline! text-muted-foreground hover:text-foreground flex gap-2 pointer-events-none" href="/teste">
					<Swords class="" size="16" strokeWidth="2" />
					{m.laptime_options_compare()}
				</a>

			</Accordion.Content>
		</Accordion.Item>
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
</Accordion.Root>

<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { RecentLaptime } from '$lib/types/listings';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	import { Button } from '$lib/components/ui/button/index.js';
	import RecentItem from '$lib/components/leaderboards/recent_item.svelte';
	import { type Icon as IconType, SlidersHorizontal } from '@lucide/svelte';

	title.set(m.nav_home());

	let { data } = $props();

	let laptime: RecentLaptime = {
		created_at: new Date().toISOString(),
		driver: 'John Doe',
		driver_avatar: 'https://avatars.githubusercontent.com/u/38655930?v=4',
		car_make: 'Audi',
		car_model: 'R8',
		track_name: 'Monza',
		laptime: 83456,
		previous_laptime: 84394,
		is_personal_best: true,
		is_track_record: false
	};
</script>

<div class="mb-4 flex items-center justify-between">
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

<div class="flex flex-col gap-2">
	{#each data.laptimes as laptime}
		<RecentItem {laptime} />
	{/each}
</div>

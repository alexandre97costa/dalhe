<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { RecentLaptime } from '$lib/types/listings';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	import RecentItem from '$lib/components/leaderboards/recent_item.svelte';
	
	title.set(m.nav_home());

	let laptime: RecentLaptime = {
		id: 1,
		laptime_ms: 123456,
		laptime_best: 140000,
		created_at: new Date().toISOString(),
		track_id: 1,
		track: "Monza",
		driver_id: "1",
		driver: "John Doe",
		driver_avatar: "https://avatars.githubusercontent.com/u/38655930?v=4",
		car_id: 1,
		car_make: "Audi",
		car_model: "R8"
	}
</script>

<div class="mb-4">
	Recent Laptimes
</div>

<RecentItem {laptime} />

<script>
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import LeaderboardEntry from '$lib/components/leaderboards/leaderboard_entry.svelte';

	title.set(m.nav_leaders());
	let { data } = $props();
</script>



<div class="flex flex-col gap-4">
	{#each data.laptimes as laptime}
		<LeaderboardEntry {laptime} />
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
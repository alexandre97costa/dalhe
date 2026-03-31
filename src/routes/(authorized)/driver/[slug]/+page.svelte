<script lang="ts">
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { RecentLaptime } from '$lib/types/listings';
	import RecentEntry from '$lib/components/leaderboards/recent_entry.svelte';
	import DriverProfile from '$lib/components/driver/DriverProfile.svelte';

	title.set(m.nav_profile());
	let { data } = $props();
</script>

<div class="pt-4 pb-6">
	<DriverProfile username={'Zé Manel'} photoUrl={'data.driver.photoUrl'} isCurrentUser={true} />
</div>

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

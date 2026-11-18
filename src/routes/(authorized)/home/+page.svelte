<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	import RigCard from '$lib/components/home/RigCard.svelte';
	import ActivityFeed from '$lib/components/home/ActivityFeed.svelte';
	import { Monitor } from '@lucide/svelte';

	title.set(m.nav_home());

	let { data } = $props();

	// No realtime: rig status is as of the load. Coming back to the tab reloads it (Decision 9).
	// The Activity feed merges the fresh first page on top of the pages already loaded.
	onMount(() => {
		const refresh = () => {
			if (document.visibilityState === 'visible') invalidateAll();
		};
		document.addEventListener('visibilitychange', refresh);
		return () => document.removeEventListener('visibilitychange', refresh);
	});
</script>

<div class="mb-6 flex flex-1 flex-col gap-3">
	{#if data.rigs.others.length > 0}
		<span class="text-foreground flex items-center gap-3 text-xl font-medium tracking-tight">
			<Monitor size={21} />
			{m.home_rigs_title()}
		</span>
	{/if}
	<RigCard rigs={data.rigs} />
</div>

<ActivityFeed activity={data.activity} />

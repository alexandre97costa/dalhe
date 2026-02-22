<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	import RecentItem from '$lib/components/leaderboards/recent_item.svelte';
	
	title.set(m.nav_home());
</script>

<div class="mb-4">
	Recent Laptimes
</div>

<RecentItem />

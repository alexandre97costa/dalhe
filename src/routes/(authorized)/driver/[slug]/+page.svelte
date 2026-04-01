<script lang="ts">
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { RecentLaptime } from '$lib/types/listings';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import RecentEntry from '$lib/components/leaderboards/recent_entry.svelte';
	import DriverProfile from '$lib/components/driver/DriverProfile.svelte';
	import { Trophy, BicepsFlexed, Medal, Award, Tally5 } from '@lucide/svelte';

	title.set(m.nav_profile());
	let { data } = $props();
</script>

<div class="flex flex-col gap-4">
	<DriverProfile username={'Alexandre'} photoUrl={'data.driver.photoUrl'} isCurrentUser={true} />
	<Separator />

	<div class="grid grid-cols-2 gap-4">
		<Item.Root variant="outline" class="flex gap-1">
			<Item.Header class="flex gap-0">
				<Item.Title>Podiums</Item.Title>
			</Item.Header>
			<Item.ItemContent class="flex-1 flex-row gap-1">
				<Award class="size-6 text-rose-500" />	
				<Item.Description class="text-xl font-light">53</Item.Description>
			</Item.ItemContent>
		</Item.Root>
		<Item.Root variant="outline" class="flex gap-1">
			<Item.Header class="flex gap-0">
				<Item.Title>Poles</Item.Title>
			</Item.Header>
			<Item.ItemContent class="flex-1 flex-row gap-1">
				<Medal class="size-6 text-amber-500" />	
				<Item.Description class="text-xl font-light">32</Item.Description>
			</Item.ItemContent>
		</Item.Root>
		<Item.Root variant="outline" class="flex gap-1">
			<Item.Header class="flex gap-0">
				<Item.Title>Dominance</Item.Title>
			</Item.Header>
			<Item.ItemContent class="flex-1 flex-row gap-1">
				<BicepsFlexed class="size-6 text-purple-500" />	
				<Item.Description class="text-xl font-light">32 pts</Item.Description>
			</Item.ItemContent>
		</Item.Root>
		<Item.Root variant="outline" class="flex gap-1">
			<Item.Header class="flex gap-0">
				<Item.Title>Laps submitted</Item.Title>
			</Item.Header>
			<Item.ItemContent class="flex-1 flex-row gap-1">
				<Tally5 class="size-6 text-blue-500" />	
				<Item.Description class="text-xl font-light">257</Item.Description>
			</Item.ItemContent>
		</Item.Root>
	</div>

	<Separator />
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

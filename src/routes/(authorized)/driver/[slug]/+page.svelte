<script lang="ts">
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { RecentLaptime } from '$lib/types/listings';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import RecentEntry from '$lib/components/leaderboards/recent_entry.svelte';
	import DriverProfile from '$lib/components/driver/DriverProfile.svelte';
	import {
		type Icon as IconType,
		Trophy,
		BicepsFlexed,
		Medal,
		Award,
		Tally5
	} from '@lucide/svelte';

	title.set(m.nav_profile());
	let { data } = $props();
</script>

{#snippet StatCard(title: string, value: string, icon: typeof IconType, color: string)}
	{@const Icon = icon}
	<Item.Root variant="outline" class="flex gap-1 bg-linear-to-bl from-card to-background">
		<Item.Header class="flex gap-0">
			<Item.Title>{title}</Item.Title>
		</Item.Header>
		<Item.ItemContent class="flex-1 flex-row gap-1">
			<Icon class={`size-6 ${color}`} />
			<Item.Description class={`text-xl font-light`}>{value}</Item.Description>
		</Item.ItemContent>
	</Item.Root>
{/snippet}

{#snippet AccordionTitle(title: string)}
	<Accordion.Trigger class="items-center">
		<h1 class="text-foreground text-xl font-bold tracking-normal text-balance">{title}</h1>
	</Accordion.Trigger>
{/snippet}

<div class="flex flex-col">
	<DriverProfile username={'Alexandre'} photoUrl={'data.driver.photoUrl'} isCurrentUser={true} />

	<Separator class="mt-4" />

	<Accordion.Root type="multiple" value={['item-1', 'item-2', 'item-3']} class="w-full">
		<!-- Stats Accordion -->
		<Accordion.Item value="item-1">
			{@render AccordionTitle('Stats')}
			<Accordion.Content class="pb-4">
				<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
					{@render StatCard('Podiums', '53', Award, 'text-rose-500')}
					{@render StatCard('Poles', '32', Medal, 'text-amber-500')}
					{@render StatCard('Dominance', '32 pts', BicepsFlexed, 'text-purple-500')}
					{@render StatCard('Laps submitted', '257', Tally5, 'text-blue-500')}
				</div>
			</Accordion.Content>
		</Accordion.Item>

		<!-- Progress Accordion -->
		<Accordion.Item value="item-2">
			{@render AccordionTitle('Progress')}
			<Accordion.Content class="pb-4 text-muted-foreground">Work in progress</Accordion.Content>
		</Accordion.Item>

		<!-- Recent Laptimes Accordion -->
		<Accordion.Item value="item-3">
			{@render AccordionTitle('Recent Laptimes')}
			<Accordion.Content class="pb-4">
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
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>

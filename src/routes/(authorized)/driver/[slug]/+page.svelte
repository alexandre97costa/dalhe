<script lang="ts">
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import type { RecentLaptime } from '$lib/types/listings';

	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import RecentEntry from '$lib/components/leaderboards/recent_entry.svelte';
	import DriverProfile from '$lib/components/driver/DriverProfile.svelte';
	import DriverChart from '$lib/components/driver/DriverChart.svelte';
	import {
		type Icon as IconType,
		Trophy,
		BicepsFlexed,
		Medal,
		Award,
		Tally5,
		CircleUserRound,
		ListFilter,
		Swords
	} from '@lucide/svelte';

	title.set(m.nav_profile());
	let { data } = $props();

	type tabView = {
		id: string;
		label: string;
	};
	let tabViewId: tabView['id'] = $state('latest');
	let tabViews: tabView[] = [
		{
			id: 'latest',
			label: m.driver_profile_latest()
		},
		{
			id: 'progress',
			label: m.driver_profile_progress()
		},
		{
			id: 'stats',
			label: m.driver_profile_stats()
		}
	];
</script>

{#snippet StatCard(title: string, value: string, icon: typeof IconType, color: string)}
	{@const Icon = icon}
	<Item.Root variant="outline" class="from-card to-background flex gap-1 bg-linear-to-bl">
		<Item.Header class="flex gap-0">
			<Item.Title>{title}</Item.Title>
		</Item.Header>
		<Item.ItemContent class="flex-1 flex-row gap-1">
			<Icon class={`size-6 ${color}`} />
			<Item.Description class={`text-xl font-light`}>{value}</Item.Description>
		</Item.ItemContent>
	</Item.Root>
{/snippet}

{#snippet TabTitle(title: string)}
	<div class="mb-4">
		<h1 class="text-foreground text-xl font-semibold tracking-wide text-balance">{title}</h1>
	</div>
{/snippet}

<div class="flex flex-col">
	<DriverProfile
		username={data.driver?.username ?? 'Unknown Driver'}
		photoUrl={data.driver?.avatar_url ?? 'https://github.com/shadcn.png'}
		isCurrentUser={false}
	/>

	<Separator class="my-4" />

	<Tabs.Root value="latest" class="w-full flex-col justify-start gap-6">
		<div class="flex justify-center">
			<Label for="tab-selector" class="sr-only">Tab</Label>
			<Tabs.List class="flex " size="default">
				{#each tabViews as view (view.id)}
					<Tabs.Trigger value={view.id}>
						{view.label}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
		</div>
		<Tabs.Content value={'latest'}>
			{@render TabTitle(m.driver_profile_latest())}
			<Accordion.Root type="single" class="flex w-full flex-col gap-4" value="">
				{#each data.laptimes as laptime, index}
					<Accordion.Item value={'item-' + index} class="not-last:border-b-0">
						<!-- Tem um accordion trigger lá dentro -->
						<RecentEntry {laptime} />

						<Accordion.Content
							class="bg-card flex flex-col gap-3 rounded-b-md border border-t-0 px-3 py-3 "
						>
							<a
								class="text-muted-foreground hover:text-foreground flex gap-2 no-underline!"
								href="/leaders?track={laptime.trackid}"
							>
								<ListFilter class="rotate-180" size="16" strokeWidth="2" />
								{m.laptime_options_goto_leaderboard()}
							</a>
							<Separator class="" />
							<a
								class="text-muted-foreground/50 hover:text-foreground pointer-events-none flex gap-2 no-underline!"
								href="/driver/{data.driver?.id}"
							>
								<Swords class="" size="16" strokeWidth="2" />
								{m.laptime_options_compare()}
								<Badge variant="outline_teal" class="ml-1">
									{m.laptime_options_compare_soon()}
								</Badge>
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
		</Tabs.Content>
		<Tabs.Content value={'progress'}>
			{@render TabTitle(m.driver_profile_progress())}
			<DriverChart />
		</Tabs.Content>
		<Tabs.Content value={'stats'}>
			{@render TabTitle(m.driver_profile_stats())}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				{@render StatCard('Podiums', `${data.stats?.podiums ?? '0'}`, Award, 'text-rose-500')}
				{@render StatCard('Poles', `${data.stats?.poles ?? '0'}`, Medal, 'text-amber-500')}
				{@render StatCard(
					'Dominance',
					`${data.stats?.dominance ?? '0'} pts`,
					BicepsFlexed,
					'text-purple-500'
				)}
				{@render StatCard(
					'Laps submitted',
					`${data.stats?.totalLaps ?? '0'}`,
					Tally5,
					'text-blue-500'
				)}
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>

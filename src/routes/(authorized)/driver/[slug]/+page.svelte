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
	type tabView = {
		id: string;
		label: string;
	};
	type statCardContent = {
		title: string;
		value: string;
		icon: typeof IconType;
		color: string;
	};

	let { data } = $props();
	let accordionValue: string = $state('');
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

	if (data.driver?.id === data.session!.user!.id) {
		title.set(m.nav_profile());
	} else {
		title.set(m.nav_driver());
	}
</script>

{#snippet StatCard(statCard: statCardContent)}
	{@const Icon = statCard.icon}
	<Item.Root variant="outline" class="from-card to-background flex gap-1 bg-linear-to-bl">
		<Item.Header class="flex gap-0">
			<Item.Title>{statCard.title}</Item.Title>
		</Item.Header>
		<Item.ItemContent class="flex-1 flex-row gap-1">
			<Icon class={`size-6 ${statCard.color}`} />
			<Item.Description class={`text-xl font-light`}>{statCard.value}</Item.Description>
		</Item.ItemContent>
	</Item.Root>
{/snippet}

{#snippet TabTitle(title: string)}
	<div class="mb-4">
		<h1 class="text-foreground text-xl font-semibold tracking-wide text-balance">{title}</h1>
	</div>
{/snippet}

{#snippet Tab_LatestLaps()}
	<Tabs.Content value={'latest'}>
		{@render TabTitle(m.driver_profile_latest())}
		<Accordion.Root type="single" class="flex w-full flex-col gap-4" value={accordionValue}>
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
						{#if data.driver?.id !== data.session!.user!.id}
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
						{/if}
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
{/snippet}

{#snippet Tab_Stats()}
	<Tabs.Content value={'stats'}>
		{@render TabTitle(m.driver_profile_stats())}
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			{@render StatCard({
				title: m.driver_stat_poles(),
				value: `${data.stats?.poles ?? '0'}`,
				icon: Medal,
				color: 'text-amber-500'
			})}
			{@render StatCard({
				title: m.driver_stat_podiums(),
				value: `${data.stats?.podiums ?? '0'}`,
				icon: Award,
				color: 'text-rose-500'
			})}
			{@render StatCard({
				title: m.driver_stat_leader_pts(),
				value: `${data.stats?.dominance ?? '0'} pts`,
				icon: BicepsFlexed,
				color: 'text-purple-400'
			})}
			{@render StatCard({
				title: m.driver_stat_total_laps(),
				value: `${data.stats?.totalLaps ?? '0'}`,
				icon: Tally5,
				color: 'text-blue-500'
			})}
		</div>
	</Tabs.Content>
{/snippet}

<div class="flex flex-col">

	<DriverProfile  
		driverForm={data.driverForm}
		username = {(data.driver?.username) ?? 'Unknown Driver'}
		photoUrl= {(data.driver?.avatar_url) ?? 'https://github.com/shadcn.png'}
		bio={(data.driver?.bio) ?? undefined}
		isCurrentUser={(data.driver?.id === data.session!.user!.id)}
	/>

	<Separator class="my-4" />

	<Tabs.Root value="latest" class="w-full flex-col justify-start gap-6">
		<div class="flex justify-center">
			<Label for="tab-selector" class="sr-only">Tab</Label>
			<Tabs.List class="flex " size="lg">
				{#each tabViews as view (view.id)}
					<Tabs.Trigger value={view.id}>
						{view.label}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
		</div>
		{@render Tab_LatestLaps()}
		
		<Tabs.Content value={'progress'}>
			{@render TabTitle(m.driver_profile_progress())}
			<DriverChart />
		</Tabs.Content>
		
		{@render Tab_Stats()}
		
	</Tabs.Root>
</div>

<script lang="ts">
	// Thin shell (Sprint 1.5, F1): header, the three lounge components, Disconnect and the
	// unclaimed list. The data contract is LoungePageData (docs/sprints/lounge-brief.md).
	import type { PageProps } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { ArrowLeft, Flag, LogOut, RefreshCw, User } from '@lucide/svelte';
	import LapList from './LapList.svelte';
	import SessionCard from './SessionCard.svelte';
	import LiveLapCard from './LiveLapCard.svelte';
	import SessionLaps from './SessionLaps.svelte';

	let { data }: PageProps = $props();

	let refreshing = $state(false);
	let status = $derived(data.status);

	$effect(() => {
		title.set(m.lounge_title({ rigName: data.rig.name }));
	});

	async function refresh() {
		refreshing = true;
		try {
			await invalidateAll();
		} finally {
			refreshing = false;
		}
	}
</script>

<div class="bg-background fixed right-0 bottom-22 left-0 z-20">
	<Button
		class="w-full rounded-none"
		variant="secondary"
		size="default"
		onclick={refresh}
		disabled={refreshing}
	>
		<RefreshCw data-icon="inline-start" class={cn(refreshing && 'animate-spin')} />
		{m.lounge_refresh()}
	</Button>
</div>
<main class="relative mx-auto flex w-full max-w-xl flex-col gap-4 pb-10">
	<header class="flex items-center gap-1">
		<Button
			class="size-7 text-muted-foreground"
			href={`/connect/${data.rig.id}`}
			variant="ghost"
			size="icon"
			aria-label={m.rig_connect_title({ rigName: data.rig.name })}
		>
			<ArrowLeft />
		</Button>
		<div class="min-w-0 flex-1 ">
			<h1 class="truncate text-2xl leading-tight font-semibold">{data.rig.name}</h1>
		</div>
		<div class="flex flex-col justify-end gap-1">
			<dt class="text-muted-foreground truncate text-xs">Now driving:</dt>

			{#if !status.session_active}
				<dd class="text-muted-foreground text-sm">
					{m.lounge_no_session_title()}
				</dd>
			{:else if data.isDriver}
				<dd class="text-foreground text-md font-medium">
					{m.lounge_you_are_driving()}
				</dd>
			{:else if status.driver_name}
				<dd class="flex items-center justify-end gap-2">
					<span class="text-md font-medium">
						{status.driver_name}
					</span>
					<!-- {m.rig_connect_driving({ driverName: status.driver_name })} -->
					<Avatar.Root size="sm">
						<Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
						<Avatar.Fallback>CN</Avatar.Fallback>
					</Avatar.Root>
				</dd>
			{:else}
				<dd class="text-md flex items-center justify-end gap-2">
					{m.lounge_anonymous_driver()}
					<User class="size-3.5 shrink-0" />
				</dd>
			{/if}

		</div>
	</header>

	{#if !status.session_active}
		<Empty.Root class="border">
			<Empty.Header>
				<Empty.Media variant="icon"><Flag /></Empty.Media>
				<Empty.Title>{m.lounge_no_session_title()}</Empty.Title>
				<Empty.Description>{m.lounge_no_session_description()}</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button href={`/connect/${data.rig.id}`} variant="cta">{m.rig_connect_to_rig()}</Button>
			</Empty.Content>
		</Empty.Root>
	{:else}
		<SessionCard
			simSession={data.simSession}
			simMapping={data.simMapping}
			statsAgeMs={data.statsAgeMs.simSession}
		/>

		<LiveLapCard
			liveLap={data.liveLap}
			liveBests={data.liveBests}
			latestLap={data.latestLap}
			bests={data.bests}
			statsAgeMs={data.statsAgeMs.liveLap}
		/>

		<SessionLaps laps={data.sessionLaps} bests={data.bests} />

		{#if data.isDriver}
			<form method="POST" action="?/disconnect" use:enhance>
				<Button type="submit" variant="outline" size="lg" class="w-full">
					<LogOut data-icon="inline-start" />
					{m.rig_disconnect_from_rig()}
				</Button>
			</form>
		{/if}

		<Card.Root class="gap-2 py-4">
			<Card.Header class="px-4">
				<Card.Title>{m.lounge_unclaimed_laps()}</Card.Title>
				<Card.Description>{m.lounge_unclaimed_laps_description()}</Card.Description>
			</Card.Header>
			<Card.Content class="px-4">
				{#if data.unclaimedLaps.length > 0}
					<LapList laps={data.unclaimedLaps} />
				{:else}
					<p class="text-muted-foreground py-2 text-sm">{m.lounge_unclaimed_laps_empty()}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</main>

<script lang="ts">
	// Thin shell (Sprint 1.5, F1): header, the three lounge components, Disconnect and the
	// unclaimed list. The data contract is LoungePageData (docs/sprints/lounge-brief.md).
	import type { PageProps } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ArrowLeft, TimerOff, LogOut, RefreshCw, User, CircleSlash, Ghost } from '@lucide/svelte';
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

{#if status.session_active}
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
{/if}
<main class="relative mx-auto flex w-full max-w-xl flex-col gap-5 pb-14">
	<header class="flex items-center gap-1">
		<Button
			class="text-muted-foreground size-7"
			href={`/connect/${data.rig.id}`}
			variant="ghost"
			size="icon"
			aria-label={m.rig_connect_title({ rigName: data.rig.name })}
		>
			<ArrowLeft />
		</Button>
		<div class="min-w-0">
			<h1 class="truncate text-2xl leading-tight font-semibold">{data.rig.name}</h1>
		</div>
		{#if data.isDriver}
			<form method="POST" action="?/disconnect" use:enhance>
				<Button type="submit" variant="secondary" size="sm" class="ml-2 text-red-400">
					<LogOut data-icon="inline-start" />
					{m.rig_disconnect_from_rig()}
				</Button>
			</form>
		{/if}
		<div class="flex flex-1 flex-col items-end justify-end gap-1">
			<dt class="text-muted-foreground truncate text-xs">{m.lounge_title_label()}</dt>

			{#if !status.session_active}
				<dd class="text-muted-foreground flex items-center justify-end gap-2 text-sm">
					{m.lounge_no_session_user()}
					<CircleSlash size={16} />
				</dd>
			{:else if status.driver_name}
				<dd class="flex items-center justify-end gap-2">
					<!-- {#if data.isDriver}
						<span class="text-muted-foreground text-sm font-bold">EU</span>
					{/if} -->

					<span class="text-md font-medium">
						{status.driver_name}
					</span>
					<!-- {m.rig_connect_driving({ driverName: status.driver_name })} -->
					<Avatar.Root size="sm">
						<Avatar.Image src={status.driver_avatar_url} alt={status.driver_name} />
						<Avatar.Fallback>{status.driver_name.charAt(0).toUpperCase()}</Avatar.Fallback>
					</Avatar.Root>
				</dd>
			{:else}
				<dd class="text-foreground flex items-center justify-end gap-2 text-sm">
					{m.lounge_anonymous_driver()}
					<Ghost size={16} />
				</dd>
			{/if}
		</div>
	</header>

	{#if !status.session_active}
		<Empty.Root class="border">
			<Empty.Header>
				<Empty.Media><TimerOff size={64} class="text-muted" /></Empty.Media>
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

		<Dialog.Root>
			<Dialog.Trigger>
				<span
					class="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2"
				>
					{m.lounge_color_meaning_link()}
				</span>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>{m.lounge_color_meaning()}</Dialog.Title>
				</Dialog.Header>
				<div class="text-muted-foreground flex flex-col gap-2 text-sm pb-2">
					<div class="flex items-center gap-2">
						<div class="h-2 w-8 min-w-8 rounded-sm bg-purple-600"></div>
						<p>{m.lounge_color_meaning_track_record()}</p>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-2 w-8 min-w-8 rounded-sm bg-blue-500"></div>
						<p>{m.lounge_color_meaning_session_best()}</p>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-2 w-8 min-w-8 rounded-sm bg-green-500"></div>
						<p>{m.lounge_color_meaning_on_pace()}</p>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-2 w-8 min-w-8 rounded-sm bg-amber-400"></div>
						<p>{m.lounge_color_meaning_off_pace()}</p>
					</div>
				</div>
				<Dialog.Close type="button" class={buttonVariants({size: "sm"})}>{m.lounge_color_meaning_gotit()}</Dialog.Close>
			</Dialog.Content>
		</Dialog.Root>

		{#if data.unclaimedLaps.length > 0}
			<Card.Root class="gap-2 py-4">
				<Card.Header class="px-4">
					<Card.Title>{m.lounge_unclaimed_laps()}</Card.Title>
					<Card.Description>{m.lounge_unclaimed_laps_description()}</Card.Description>
				</Card.Header>
				<Card.Content class="px-4">
					<LapList laps={data.unclaimedLaps} />
					<!-- <p class="text-muted-foreground py-2 text-sm">{m.lounge_unclaimed_laps_empty()}</p> -->
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</main>

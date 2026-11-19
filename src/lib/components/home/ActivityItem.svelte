<script lang="ts">
	// One item of the homepage Activity feed, read like a post: a single lap ("paulo set a track
	// record") or a stint, the laps of one session on the same track and car ("carla made 8
	// laps"). The sentence (avatar, who, when) sits above the card; the card's header (the
	// trigger) shows the lap, or the stint's best, and opens the panel with the actions. A stint
	// lists its laps below the header. "View session" posts to the rig's Spectate action like
	// the rig card's Watch, so it works without JS.
	import type { ActivityGroup, ActivityLap } from '$lib/types/home';
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Message from '$lib/components/Message.svelte';
	import { formatLaptime, formatTimeSinceCreation, compareLaptimes } from '$lib/utils/laptime';
	import {
		ACTIVITY_GROUP_PREVIEW,
		activityGroupSummary,
		activityRowState
	} from '$lib/utils/activity';
	import { cn } from '$lib/utils';
	import { CircleUserRound, Eye, ListFilter, Swords } from '@lucide/svelte';

	let { group }: { group: ActivityGroup } = $props();

	// The newest lap speaks for the item: who, when, and whether the session is still live.
	const lap = $derived(group.laps[0]);
	const isStint = $derived(group.laps.length > 1);
	const summary = $derived(activityGroupSummary(group.laps));
	const kind = $derived(isStint ? summary.kind : activityRowState(lap).kind);
	const headline = $derived(
		isStint
			? null
			: kind === 'record'
				? m.activity_headline_record
				: kind === 'personalBest'
					? m.activity_headline_personal_best
					: m.activity_headline_upload
	);

	let showAll = $state(false);
	const listed = $derived(showAll ? group.laps : group.laps.slice(0, ACTIVITY_GROUP_PREVIEW));

	const panelItem =
		'text-foreground flex min-h-11 w-full items-center gap-2 font-medium no-underline!';
</script>

<!-- A lap's pill (record, personal best) or, for a plain lap, its delta to the previous one. -->
{#snippet marker(lap: ActivityLap, size: 'sm' | 'xs')}
	{@const rowKind = activityRowState(lap).kind}
	{#if rowKind === 'record'}
		<span
			class="rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300"
		>
			{m.activity_pill_record()}
		</span>
	{:else if rowKind === 'personalBest'}
		<span
			class="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-semibold text-yellow-700 dark:text-yellow-300"
		>
			{m.activity_pill_personal_best()}
		</span>
	{:else}
		{@const delta = compareLaptimes(lap.laptime, lap.previousLaptime)}
		<span
			class={cn(
				'font-mono tabular-nums',
				size === 'sm' ? 'text-xs' : 'text-[11px]',
				delta.diff === '0.0s'
					? 'text-muted-foreground'
					: delta.isFaster
						? 'text-green-400'
						: 'text-red-400'
			)}
		>
			{delta.diff}
		</span>
	{/if}
{/snippet}

<Accordion.Item value={group.key} class="flex flex-col gap-2 not-last:border-b-0">
	<!-- Who and when, outside the card: the whole width for the sentence. -->
	<div class="flex min-w-0 items-center gap-2 px-1">
		<Avatar.Root size="sm" class="size-6">
			<Avatar.Image src={lap.driverAvatarUrl} alt={lap.driverName} />
			<Avatar.Fallback
				class="bg-purple-500/15 text-[10px] font-semibold text-purple-700 dark:text-purple-300"
			>
				{lap.driverName.charAt(0).toUpperCase()}
			</Avatar.Fallback>
			{#if lap.activeRigId}
				<Avatar.Badge class="size-2 bg-green-500" />
			{/if}
		</Avatar.Root>
		<p class="text-foreground min-w-0 flex-1 text-sm leading-snug">
			{#if headline}
				<Message message={headline} inputs={{ driver: lap.driverName }} />
			{:else}
				<Message
					message={m.activity_headline_group}
					inputs={{ driver: lap.driverName, count: group.laps.length }}
				/>
			{/if}
		</p>
		<span class="text-muted-foreground shrink-0 text-xs">
			{formatTimeSinceCreation(lap.createdAt)}
		</span>
	</div>

	<!-- The lap or the stint, inside the card. -->
	<div
		class={cn(
			'bg-card overflow-hidden rounded-2xl border',
			kind === 'record' && 'border-purple-500/50 bg-purple-500/10',
			kind === 'personalBest' && 'border-yellow-500/40 bg-yellow-500/[0.06]'
		)}
	>
		<Accordion.Trigger
			class="flex min-h-16 min-w-0 cursor-pointer items-center gap-3 rounded-none px-4 py-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:self-center"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-0.5">
				<span class="text-foreground text-base leading-tight font-semibold break-words"
					>{lap.trackName}</span
				>
				<span class="text-muted-foreground truncate text-xs font-normal">
					{lap.carMake}
					{lap.carModel}
				</span>
			</div>

			<div class="flex shrink-0 flex-col items-end gap-1 text-right">
				{#if isStint}
					<span class="font-mono text-lg font-bold tabular-nums"
						>{formatLaptime(summary.best.laptime)}</span
					>
					<span class="text-muted-foreground text-[11px] font-normal">
						{m.activity_group_best({ count: group.laps.length })}
					</span>
				{:else}
					<span class="font-mono text-lg font-bold tabular-nums">{formatLaptime(lap.laptime)}</span>
					{@render marker(lap, 'sm')}
				{/if}
			</div>
		</Accordion.Trigger>

		<Accordion.Content class="border-t px-4 pb-1 text-sm">
			{#if lap.activeRigId}
				<form method="POST" action={`/connect/${lap.activeRigId}?/spectate`} use:enhance>
					<button type="submit" class={cn(panelItem, 'cursor-pointer text-left')}>
						<Eye size="16" strokeWidth="2" />
						{m.activity_view_session()}
					</button>
				</form>
				<Separator />
			{/if}
			<a class={panelItem} href="/driver/{lap.driverId}">
				<CircleUserRound size="16" strokeWidth="2" />
				{m.laptime_options_goto_driver()}
			</a>
			<Separator />
			<a class={panelItem} href="/leaders?track={lap.trackId}">
				<ListFilter class="rotate-180" size="16" strokeWidth="2" />
				{m.laptime_options_goto_leaderboard()}
			</a>
			<Separator />
			<span class={cn(panelItem, 'text-muted-foreground/50')} aria-disabled="true">
				<Swords size="16" strokeWidth="2" />
				{m.laptime_options_compare()}
				<Badge variant="outline_teal" class="ml-1">{m.laptime_options_compare_soon()}</Badge>
			</span>
		</Accordion.Content>

		{#if isStint}
			<!-- The stint's laps, newest first. The fastest is bold. -->
			<ul class="divide-y border-t">
				{#each listed as row (row.lapId)}
					<li class="flex min-h-10 items-center gap-3 px-4 py-2">
						<span
							class={cn(
								'font-mono text-sm tabular-nums',
								row === summary.best ? 'font-bold' : 'font-medium'
							)}
						>
							{formatLaptime(row.laptime)}
						</span>
						{@render marker(row, 'xs')}
						<span class="text-muted-foreground ml-auto shrink-0 text-xs">
							{formatTimeSinceCreation(row.createdAt)}
						</span>
					</li>
				{/each}
			</ul>
			{#if group.laps.length > ACTIVITY_GROUP_PREVIEW}
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground min-h-10 w-full cursor-pointer border-t text-xs font-medium"
					onclick={() => (showAll = !showAll)}
				>
					{showAll
						? m.activity_group_show_less()
						: m.activity_group_show_all({ count: group.laps.length })}
				</button>
			{/if}
		{/if}
	</div>
</Accordion.Item>

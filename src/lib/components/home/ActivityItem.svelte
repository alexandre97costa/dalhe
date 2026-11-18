<script lang="ts">
	// One item of the homepage Activity feed: a lap read like a post ("paulo set a track record").
	// The sentence (avatar, who, when) sits above the card; the card (the trigger) shows the lap
	// and opens the panel with the actions. "View session"
	// posts to the rig's Spectate action like the rig card's Watch, so it works without JS.
	import type { ActivityLap } from '$lib/types/home';
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Message from '$lib/components/Message.svelte';
	import { formatLaptime, formatTimeSinceCreation, compareLaptimes } from '$lib/utils/laptime';
	import { activityRowState } from '$lib/utils/activity';
	import { cn } from '$lib/utils';
	import { CircleUserRound, Eye, ListFilter, Swords } from '@lucide/svelte';

	let { lap }: { lap: ActivityLap } = $props();

	const state = $derived(activityRowState(lap));
	const delta = $derived(compareLaptimes(lap.laptime, lap.previousLaptime));
	const headline = $derived(
		state.kind === 'record'
			? m.activity_headline_record
			: state.kind === 'personalBest'
				? m.activity_headline_personal_best
				: m.activity_headline_upload
	);

	const panelItem =
		'text-foreground flex min-h-11 w-full items-center gap-2 font-medium no-underline!';
</script>

<Accordion.Item value={String(lap.lapId)} class="flex flex-col gap-2 not-last:border-b-0">
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
			<Message message={headline} inputs={{ driver: lap.driverName }} />
		</p>
		<span class="text-muted-foreground shrink-0 text-xs">
			{formatTimeSinceCreation(lap.createdAt)}
		</span>
	</div>

	<!-- The lap, inside the card. -->
	<div
		class={cn(
			'bg-card overflow-hidden rounded-2xl border',
			state.kind === 'record' && 'border-purple-500/50 bg-purple-500/10',
			state.kind === 'personalBest' && 'border-yellow-500/40 bg-yellow-500/[0.06]'
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
				<span class="font-mono text-lg font-bold tabular-nums">{formatLaptime(lap.laptime)}</span>
				{#if state.kind === 'record'}
					<span
						class="rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300"
					>
						{m.activity_pill_record()}
					</span>
				{:else if state.kind === 'personalBest'}
					<span
						class="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-semibold text-yellow-700 dark:text-yellow-300"
					>
						{m.activity_pill_personal_best()}
					</span>
				{:else}
					<span
						class={cn(
							'font-mono text-xs tabular-nums',
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
	</div>
</Accordion.Item>

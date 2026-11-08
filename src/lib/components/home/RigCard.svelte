<script lang="ts">
	// The homepage rig card (Sprint 2, U1/U2). Renders only what the load gives it (HomeRigs):
	// the red carpet when the user drives, then by count: empty state, one full card, or a list.
	// Watch posts to the rig's Spectate action and Connect links to the connect page, so both work
	// without client JS.
	import type { HomeRigs, MyRig } from '$lib/types/home';
	import { m } from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { enhance } from '$app/forms';
	import { Eye, Gamepad2, ScanQrCode, ArrowRight } from '@lucide/svelte';
	import RigStatusLabel from './RigStatusLabel.svelte';
	import { cn } from '$lib/utils';
	import Message from '$lib/components/Message.svelte';

	let { rigs }: { rigs: HomeRigs } = $props();
</script>

{#snippet watch(rig: MyRig, size: 'default' | 'sm')}
	<form method="POST" action={`/connect/${rig.id}?/spectate`} use:enhance>
		<Button type="submit" variant="cta" {size} class="w-full">
			<Eye />
			{m.home_rig_watch()}
		</Button>
	</form>
{/snippet}

<section aria-labelledby="home-rigs-title" class="flex flex-col gap-3">
	<!-- <h2 id="home-rigs-title" class="text-foreground text-xl font-medium tracking-tight">
		{m.home_rigs_title()}
	</h2> -->

	<ul class="bg-card text-card-foreground divide-y rounded-xl border shadow-sm">
		{#each rigs.others as rig (rig.id)}
			{@const kind = !rig.sessionActive
				? 'free'
				: rig.isAnonymous
					? 'anonymous'
					: ('driving' as const)}

			<li class={cn('text-muted-foreground flex items-center gap-4 p-4 text-sm')}>
				<span
					aria-hidden="true"
					class={cn(
						' size-3 shrink-0 rounded-full',
						kind === 'free' && 'bg-card-foreground/20',
						kind === 'driving' && 'animate-pulse bg-green-500',
						kind === 'anonymous' && 'animate-pulse bg-blue-500'
					)}
				></span>
				<Avatar.Root >
						<Avatar.Image src={rig.driverAvatarUrl} alt={rig.driverName ?? ''} />
						<Avatar.Fallback>{rig.driverName?.charAt(0).toUpperCase()}</Avatar.Fallback>
					</Avatar.Root>
				<div class="flex min-w-0 flex-1 flex-col">
					<span class="truncate text-card-foreground font-medium">
						{#if kind === 'free'}
							{m.home_rig_status_free()}
						{:else if kind === 'anonymous'}
							{m.home_rig_status_anonymous()}
						{:else}
							<Message
								message={m.home_rig_status_driving}
								inputs={{ driverName: rig.driverName ?? '' }}
							/>
						{/if}
					</span>
					<span>{rig.name}</span>
					<!-- <RigStatusLabel {rig} /> -->
				</div>
				<Button
					href={`/connect/${rig.id}`}
					variant="secondary"
					size="icon-sm"
					class="text-muted-foreground shrink-0"
					aria-label={m.home_rig_connect()}
				>
					<ArrowRight />
				</Button>
			</li>
		{/each}
	</ul>

	{#if rigs.driving}
		<!-- Red carpet: the rig the user is driving. Already associated, so a plain link. -->
		<div
			class="flex items-center justify-between gap-3 rounded-xl border border-purple-500/50 bg-purple-500/10 p-4"
		>
			<p class="flex min-w-0 items-start gap-2 font-medium">
				<!-- <span
					aria-hidden="true"
					class="mt-2 size-2 shrink-0 animate-pulse rounded-full bg-purple-500"
				></span> -->
				<span>{m.home_rig_you_are_driving({ rigName: rigs.driving.name })}</span>
			</p>
			<Button href={`/connect/${rigs.driving.id}/lounge`} variant="cta" class="shrink-0">
				{m.home_rig_lounge()}
			</Button>
		</div>
	{/if}

	{#if rigs.others.length === 1}
		{@const rig = rigs.others[0]}
		<div class="bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
			<div class="flex min-w-0 flex-col gap-1">
				<h3 class="truncate text-2xl font-semibold tracking-tight">{rig.name}</h3>
				<RigStatusLabel {rig} />
			</div>
			<div class="grid grid-cols-2 gap-3">
				{@render watch(rig, 'default')}
				<Button href={`/connect/${rig.id}`} variant="outline">
					<Gamepad2 />
					{m.home_rig_connect()}
				</Button>
			</div>
		</div>
	{:else if rigs.others.length > 1}
		<ul class="bg-card text-card-foreground divide-y rounded-xl border shadow-sm">
			{#each rigs.others as rig (rig.id)}
				<li class="flex items-center gap-3 p-3">
					<div class="flex min-w-0 flex-1 flex-col">
						<span class="truncate font-medium">{rig.name}</span>
						<RigStatusLabel {rig} />
					</div>
					<Button
						href={`/connect/${rig.id}`}
						variant="secondary"
						size="icon-sm"
						class="text-muted-foreground shrink-0"
						aria-label={m.home_rig_connect()}
					>
						<ArrowRight />
						<!-- {m.home_rig_connect()} -->
					</Button>
					<!-- <div class="shrink-0">{@render watch(rig, 'sm')}</div> -->
				</li>
			{/each}
		</ul>
	{:else if !rigs.driving}
		<div
			class="text-muted-foreground flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm"
		>
			<ScanQrCode class="shrink-0" size="20" />
			<p>{m.home_rigs_empty()}</p>
		</div>
	{/if}
</section>

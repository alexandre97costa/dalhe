<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils.js';
	import { formatTimeSinceCreation, formatLaptime, compareLaptimes } from '$lib/utils/laptime';
	import type { LeaderboardEntry } from '$lib/types/listings.js';

	let { laptime }: { laptime: LeaderboardEntry } = $props();

	const { diff, isFaster } = compareLaptimes(laptime.laptime, laptime.track_record ?? null);
</script>

<!-- class={cn("flex flex-col items-center gap-2 pt-3", titleValue == item.title ? "dark:bg-zinc-800 bg-white" : "")} -->

<div
	class={cn(
		'bg-card flex items-center gap-4 rounded-md border px-3 py-2',
		laptime.rank == 1
			? 'border-yellow-400 bg-linear-to-r from-yellow-400/30  to-yellow-600/20 to-70%'
			: '',
		laptime.rank == 2
			? 'border-slate-400 bg-linear-to-r from-slate-400/30  to-slate-600/20 to-70%'
			: '',
		laptime.rank == 3
			? 'border-orange-400 bg-linear-to-r from-orange-400/30  to-orange-600/20 to-70%'
			: ''
	)}
>
	{laptime.rank}
	<div class="flex flex-1 flex-col">
		<p class="lh-1 text-muted-foreground/50 text-xs">
			{formatTimeSinceCreation(laptime.created_at ?? new Date().toISOString())}
		</p>
		<p class="text-md font-extralight">{laptime.driver}</p>
		<p class="lh-1 text-sm">
			<span class="text-muted-foreground/50 mr-1">{m.laptime_details_with_car()}</span>
			<span class="text-foreground/50">{`${laptime.car_make} ${laptime.car_model}`}</span>
		</p>
	</div>
	<div class={cn('flex flex-col text-right ', laptime.rank == 1 ? 'self-center' : 'self-start')}>
		{#if laptime.rank !== 1}
			<p class={'lh-1 text-muted-foreground/50 font-mono text-xs'}>
				{diff}
			</p>
		{/if}
		<h1 class="lh-1 text-md font-mono font-medium tracking-widest">
			{formatLaptime(laptime.laptime)}
		</h1>
	</div>
</div>

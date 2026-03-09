<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { formatTimeSinceCreation, formatLaptime, compareLaptimes } from '$lib/utils/laptime';
	import type { RecentLaptime } from '$lib/types/listings.js';

	let { laptime }: { laptime: RecentLaptime } = $props();

	const { diff, isFaster } = compareLaptimes(laptime.laptime, laptime.previous_laptime ?? null);
</script>

<div>
	{#if laptime.is_track_record}
		<div
			class="-mb-2 flex w-full rounded-md rounded-b-none border border-b-0 bg-purple-500/20 px-3 pt-1 pb-3 text-xs text-purple-400"
		>
			{m.laptime_track_record()}
		</div>
	{:else if laptime.is_personal_best}
		<div
			class="-mb-2 flex w-full rounded-md rounded-b-none border border-b-0 bg-yellow-500/20 px-3 pt-1 pb-3 text-xs text-yellow-400"
		>
			{m.laptime_personal_best()}
		</div>
	{/if}
	<div class="bg-card flex items-center gap-4 rounded-md border px-3 py-2">

		<div class="flex flex-col flex-1">
			<p class="lh-1 text-muted-foreground/50 text-xs">
				{formatTimeSinceCreation(laptime.created_at ?? new Date().toISOString())}
			</p>
			<p class="text-md font-extralight">{laptime.driver}</p>
			<p class="lh-1 text-muted-foreground text-sm">
				<span class="text-muted-foreground/50 mr-1">{m.laptime_details_with_car()}</span>
				{`${laptime.car_make} ${laptime.car_model}`}
			</p>
		</div>
		<div class="flex flex-col justify-end text-right self-end">
			<p
				class={`lh-1 font-mono text-xs  ${diff == '0.0s' ? 'text-muted-foreground/50' : isFaster ? 'text-green-400/70' : 'text-red-400/70'}`}
			>
				{diff}
			</p>
			<h1 class="lh-1 text-md font-mono font-medium tracking-widest">
				{formatLaptime(laptime.laptime)}
			</h1>
			<p class="lh-1 text-muted-foreground text-sm" >
				<span class="text-muted-foreground/50 mr-1">{m.laptime_details_at_track()}</span>
				{laptime.track_name}
			</p>
		</div>
	</div>
</div>

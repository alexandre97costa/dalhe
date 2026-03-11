<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { formatTimeSinceCreation, formatLaptime, compareLaptimes } from '$lib/utils/laptime';
	import type { LeaderboardEntry } from '$lib/types/listings.js';

	let { laptime }: { laptime: LeaderboardEntry } = $props();

	const { diff, isFaster } = compareLaptimes(laptime.laptime, laptime.track_record ?? null);
</script>

<div class="bg-card flex items-center gap-4 rounded-md border px-3 py-2">
	{laptime.rank}
	<div class="flex flex-1 flex-col">
		<p class="lh-1 text-muted-foreground/50 text-xs">
			{formatTimeSinceCreation(laptime.created_at ?? new Date().toISOString())}
		</p>
		<p class="text-md font-extralight">{laptime.driver}</p>
		<p class="lh-1 text-muted-foreground text-sm">
			<span class="text-muted-foreground/50 mr-1">{m.laptime_details_with_car()}</span>
			{`${laptime.car_make} ${laptime.car_model}`}
		</p>
	</div>
	<div class="flex flex-col justify-end self-end text-right">
		<p class={'lh-1 text-muted-foreground/50 font-mono text-xs'}>
			{diff}
		</p>
		<h1 class="lh-1 text-md font-mono font-medium tracking-widest">
			{formatLaptime(laptime.laptime)}
		</h1>
	</div>
</div>

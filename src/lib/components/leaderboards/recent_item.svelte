<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { formatTimeSinceCreation, formatLaptime, compareLaptimes } from '$lib/utils/laptime';
	import type { RecentLaptime } from '$lib/types/listings.js';

	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { type Icon as IconType, MapPin, Timer, Car } from '@lucide/svelte';

	let { laptime }: { laptime: RecentLaptime } = $props();

	let IsBest = $derived(() => {
		return compareLaptimes(laptime.laptime_ms, laptime.laptime_best).isFaster;
	});

    const test_TrackRecord: boolean = false; // TODO: replace with actual check against track record
</script>

<div>
    {#if test_TrackRecord}
        <div
            class="-mb-2 flex w-full rounded-md rounded-b-none border border-b-0 bg-purple-500/20 px-3 pt-1 pb-3 text-xs text-purple-400"
        >
            Track Record!
        </div>
    {:else if IsBest()}
        <div
			class="-mb-2 flex w-full rounded-md rounded-b-none border border-b-0 bg-yellow-500/20 px-3 pt-1 pb-3 text-xs text-yellow-400"
		>
			Personal Best!
		</div>
    {/if}
	<div class="flex items-center gap-4 rounded-md border px-3 py-2 bg-card">
		<Avatar.Root class="  size-12 border-purple-500 bg-purple-500 dark:border-purple-600">
			<Avatar.Image
				src={laptime?.driver_avatar ?? 'https://avatars.githubusercontent.com/u/38655930?v=4'}
				alt={laptime?.driver ?? 'Driver avatar'}
			/>
			<Avatar.Fallback>CN</Avatar.Fallback>
		</Avatar.Root>

		<div class="flex flex-1 flex-col">
			<p class="lh-1 text-muted-foreground text-xs">
				{formatTimeSinceCreation(laptime.created_at)}
			</p>
			<p class="text-md">{laptime.driver}</p>
			<p class="lh-1 text-muted-foreground text-xs">
				<Car class="-mt-1 mr-1 inline size-4" strokeWidth="2" />
				<!-- eg. Audi R8 -->
				{`${laptime.car_make} ${laptime.car_model}`}
			</p>
		</div>
		<div class="flex flex-col justify-end text-right">
			<p class="lh-1 text-muted-foreground text-xs">
				{laptime.track}
				<MapPin class="-mt-1 ml-1 inline size-4" strokeWidth="2" />
			</p>
			<h1 class="lh-1 font-mono text-lg font-bold">{formatLaptime(laptime.laptime_ms)}</h1>
			<p class={`lh-1 font-mono text-xs ${IsBest() ? 'text-green-400' : 'text-red-400'}`}>
				<!-- {#if IsBest()}
            <Badge variant="outline_purple" class="mt-1 ml-1">PB</Badge>
            <Badge variant="purple" class="mt-1 ml-1">TR</Badge>
			{/if} -->
				{compareLaptimes(laptime.laptime_ms, laptime.laptime_best).diff}
			</p>
		</div>
	</div>
</div>

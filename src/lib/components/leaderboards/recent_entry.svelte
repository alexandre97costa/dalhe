<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { formatTimeSinceCreation, formatLaptime, compareLaptimes } from '$lib/utils/laptime';
	import type { RecentLaptime } from '$lib/types/listings.js';
	import { cn } from '$lib/utils';

	let { laptime }: { laptime: RecentLaptime } = $props();

	const { diff, isFaster } = compareLaptimes(laptime.laptime, laptime.previous_laptime ?? null);
</script>



<Accordion.Trigger
	class={cn(
		`to-background shadow-md/5 hover:no-underline cursor-pointer flex items-center gap-2 rounded-md border bg-linear-to-bl pl-3 pr-2 py-2`,
		laptime.is_track_record
			? 'border-purple-500/30 from-purple-500/15 '
			: laptime.is_personal_best
				? 'border-yellow-500/20 from-yellow-500/15'
				: 'border-accent from-card'
	)}
>
	<div class="flex flex-1 flex-col gap-1">
		<p class="lh-1 text-muted-foreground/50 text-xs">
			{formatTimeSinceCreation(laptime.created_at ?? new Date().toISOString())}
		</p>
		<p class="text-md font-light tracking-wide">{laptime.driver}</p>
		<p class="lh-1 text-muted-foreground text-sm">
			<span class="text-muted-foreground/50 mr-1">{m.laptime_details_with_car()}</span>
			{`${laptime.car_make} ${laptime.car_model}`}
		</p>
	</div>
	<div class="flex flex-col justify-end gap-0.5 self-end text-right">
		{#if laptime.is_track_record}
			<p class="lh-1 text-xs text-purple-400">
				{m.laptime_track_record()}
			</p>
		{:else if laptime.is_personal_best}
			<p class="lh-1 text-xs text-yellow-400">
				{m.laptime_personal_best()}
			</p>
		{:else}
			<p
				class={cn(`lh-1 font-mono text-xs  
						${
							diff == '0.0s'
								? 'text-muted-foreground/50'
								: isFaster
									? 'text-green-400/70'
									: 'text-red-400/70'
						}`)}
			>
				{diff}
			</p>
		{/if}
		<h1
			class="lh-1 text-foreground-100/80 font-mono text-xl font-medium tracking-widest text-shadow-md"
		>
			{formatLaptime(laptime.laptime)}
		</h1>
		<p class="lh-1 text-muted-foreground text-sm">
			<span class="text-muted-foreground/50 mr-1">{m.laptime_details_at_track()}</span>
			{laptime.track_name}
		</p>
	</div>
</Accordion.Trigger>
<script lang="ts">
	import { formatLaptime } from '$lib/utils/laptime';

	type Lap = {
		id: number;
		time_milliseconds: number;
	};

	let { laps, bestLap }: { laps: Lap[]; bestLap: number | null } = $props();

	function formatLapTime(milliseconds: number): string {
		return formatLaptime(milliseconds).replace(/^0(?=\d:)/, '');
	}
</script>

<section class="flex flex-col gap-2.5" aria-labelledby="previous-laps-title">
	<header class="flex items-end justify-between gap-3">
		<h2 id="previous-laps-title" class="text-base font-semibold tracking-wide uppercase">
			Previous laps
		</h2>
		<span class="text-sm text-[#a6a4b8]">{laps.length} recent laps</span>
	</header>

	{#if laps.length > 0}
		<div class="overflow-hidden rounded-2xl border border-[#292833] bg-[#111117]">
			<div
				class="grid grid-cols-[1.75rem_minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))] items-center gap-2 border-b border-[#292833] px-3.5 py-2.5 text-xs text-[#a6a4b8]"
			>
				<span>Lap</span>
				<span>Time</span>
				<span class="text-center">S1</span>
				<span class="text-center">S2</span>
				<span class="text-center">S3</span>
			</div>
			<ol>
				{#each laps as lap, index (lap.id)}
					{@const delta = bestLap === null ? null : lap.time_milliseconds - bestLap}
					{@const isBest = delta === 0}
					<li
						class="grid grid-cols-[1.75rem_minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))] items-center gap-2 border-b border-[#292833] px-3.5 py-2.5 last:border-b-0"
					>
						<span class="text-sm text-[#a6a4b8]">{laps.length - index}</span>
						<div class="flex min-w-0 flex-col">
							<strong class="font-mono text-base font-semibold tabular-nums">
								{formatLapTime(lap.time_milliseconds)}
							</strong>
							<span
								class="text-[11px] leading-tight font-semibold"
								class:text-[#c278ff]={isBest}
								class:text-[#ff6767]={delta !== null && delta > 0}
								class:text-[#42df80]={delta !== null && delta < 0}
								class:text-[#a6a4b8]={delta === null}
							>
								{isBest
									? 'Rig best'
									: delta === null
										? 'No best available'
										: `${delta > 0 ? '+' : '−'}${(Math.abs(delta) / 1000).toFixed(3)}s`}
							</span>
						</div>
						<span
							class="text-center font-mono text-sm font-semibold text-[#a6a4b8] tabular-nums"
							aria-label="Sector 1 split unavailable"
							title="Historical sector split unavailable">—</span
						>
						<span
							class="text-center font-mono text-sm font-semibold text-[#a6a4b8] tabular-nums"
							aria-label="Sector 2 split unavailable"
							title="Historical sector split unavailable">—</span
						>
						<span
							class="text-center font-mono text-sm font-semibold text-[#a6a4b8] tabular-nums"
							aria-label="Sector 3 split unavailable"
							title="Historical sector split unavailable">—</span
						>
					</li>
				{/each}
			</ol>
		</div>
		<p class="px-1 text-[11px] text-[#777586]">Historical sector splits aren't stored yet.</p>
	{:else}
		<p
			class="rounded-2xl border border-[#292833] bg-[#111117] px-4 py-6 text-center text-sm text-[#a6a4b8]"
		>
			No completed laps have been recorded for this rig yet.
		</p>
	{/if}
</section>

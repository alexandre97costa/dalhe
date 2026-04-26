<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Area, AreaChart, LinearGradient, defaultChartPadding } from 'layerchart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';

	const chartData = [
		{ lap: 'n - 5', desktop: 186, mobile: 80 },
		{ lap: 'n - 4', desktop: 305, mobile: 200 },
		{ lap: 'n - 3', desktop: 237, mobile: 120 },
		{ lap: 'n - 2', desktop: 73, mobile: 190 },
		{ lap: 'n - 1', desktop: 209, mobile: 130 },
		{ lap: 'n', desktop: 214, mobile: 140 }
	];

	const chartConfig = {
		desktop: { label: 'Desktop', color: 'var(--color-purple-500)' },
		mobile: { label: 'Mobile', color: 'var(--color-amber-500)' }
	} satisfies Chart.ChartConfig;
</script>

<Chart.Container config={chartConfig}>
	<AreaChart
		data={chartData}
		x="lap"
		yPadding={[0, 25]}
		series={[
			{
				key: 'mobile',
				label: 'Mobile',
				color: 'var(--color-mobile)'
			},
			{
				key: 'desktop',
				label: 'Desktop',
				color: 'var(--color-desktop)'
			}
		]}
		padding={defaultChartPadding({ right: 0, left: 0 })}
		seriesLayout="stack"
		props={{
			xAxis: {
				format: (v) => v
			},
			yAxis: { format: () => '' }
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip
				indicator="dot"
				labelFormatter={(v: string) => {
					return 'Lap ' + v;
				}}
			/>
		{/snippet}
		{#snippet marks({ context })}
			{#each context.series.visibleSeries as s (s.key)}
				<LinearGradient
					stops={[s.color ?? '', 'color-mix(in lch, ' + s.color + ' 10%, transparent)']}
					vertical
				>
					{#snippet children({ gradient })}
						<Area
							seriesKey={s.key}
							fillOpacity={0.4}
							line={{ class: 'stroke-1' }}
							motion="tween"
							{...s.props}
							fill={gradient}
						/>
					{/snippet}
				</LinearGradient>
			{/each}
		{/snippet}
	</AreaChart>
</Chart.Container>

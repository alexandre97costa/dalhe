<script lang="ts">
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { PieChart, Text } from 'layerchart';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';

	let { value, label, isBB = false } = $props();

	const maxValue = 12;
	const maxBB = 30;
	const preBB = Math.sign(value) == -1 ? maxBB - Math.abs(value) : maxBB;
	const postBB = Math.sign(value) == 1 ? maxBB - Math.abs(value) : maxBB;
    const currentColor = (
        label == 'TC' ? 'var(--chart-5)' : '' +
        label == 'ABS' ? 'var(--chart-3)' : '' +
        label == 'BB' ? 'var(--chart-1)' : ''
    )

	const chartConfig = {
		muted: { label: 'muted', color: 'var(--muted)' },
		TC: { label: 'TC', color: 'var(--chart-5)' },
		ABS: { label: 'ABS', color: 'var(--chart-3)' },
		BB: { label: 'BB', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

</script>

<Card.Root class="flex flex-col border-0 p-0 pt-7 pb-3">
	<Card.Content class="flex-1">
		<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[250px]">
			<PieChart
				data={[
					{ key: 'null', value: isBB ? preBB : 0, color: chartConfig.muted.color },
					{
						key: 'value',
						value: Math.abs(value),
						color: currentColor
					},
					{ key: 'null', value: isBB ? postBB : maxValue - value, color: chartConfig.muted.color }
				]}
				key="key"
				value="value"
				c="color"
				innerRadius={30}
				padding={5}
				range={[-135, 135]}
				props={{ pie: { sort: null } }}
				cornerRadius={4}
			>
				{#snippet aboveMarks()}
					<Text
						value={label}
						textAnchor="middle"
						verticalAnchor="middle"
						class="text-muted-foreground text-xs"
						dy={-48}
					/>
					<Text
						value={isBB ? '-' + maxBB: '0'}
						textAnchor="middle"
						verticalAnchor="middle"
						class="text-muted-foreground/70 text-xs"
						dy={29}
						dx={-18}
					/>
					<Text
                        value={isBB ? '+' + maxBB: maxValue}
						textAnchor="middle"
						verticalAnchor="middle"
						class="text-muted-foreground/70 text-xs"
						dy={29}
						dx={18}
					/>
					<Text
						{value}
						textAnchor="middle"
						verticalAnchor="middle"
						class="fill-foreground text-xl! font-bold"
						dy={1}
					/>
				{/snippet}
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel />
				{/snippet}
			</PieChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>

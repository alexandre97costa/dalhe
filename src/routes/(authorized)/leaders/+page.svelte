<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { title } from '$lib/store.js';
	import { goto } from '$app/navigation';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	// data from the server includes the full track/category lists plus the
	// id that was actually used to compute the leaderboard; we use those
	// values to bootstrap the dropdowns so they start in a valid state.
	let { data } = $props();
	let initialTrackId: number | undefined = data.selectedTrackId;
	let initialCategoryId: number | undefined = data.selectedCategoryId;

	let selectedTrackId = $state<string | undefined>(initialTrackId?.toString());
	let selectedTrack = $state<string | null>(
		initialTrackId
			? data.tracks?.find((t) => t.id === Number(initialTrackId))?.name ?? null
			: null
	);
	let selectedCategoryId = $state<string | undefined>(initialCategoryId?.toString());
	let selectedCategory = $state<string | null>(
		initialCategoryId
			? data.categories?.find((c) => c.id === Number(initialCategoryId))?.name ?? null
			: null
	);

	function updateUrl() {
		const params = new URLSearchParams();
		if (selectedTrackId) params.set('track', selectedTrackId);
		if (selectedCategoryId) params.set('category', selectedCategoryId);
		goto(`?${params.toString()}`, { replaceState: true, noScroll: true });
	}
</script>

<div class="grid grid-cols-5 gap-4">
	<Field.Field class="col-span-3">
		<!-- <Field.Label for="input-id">{m.filters_track()}</Field.Label> -->
		<Select.Root
			type="single"
			bind:value={selectedTrackId}
			onValueChange={(value) => {
				selectedTrack = data.tracks?.find((track) => track.id.toString() === value)?.name || null;
				selectedTrackId = value;
				updateUrl();
			}}
		>
			<Select.Trigger class="w-full">
				{#if selectedTrack}
					{selectedTrack}
				{:else}
					{m.filters_track_placeholder()}
				{/if}
			</Select.Trigger>
			<Select.Content>
				{#each data.tracks as track}
					<Select.Item value={track.id.toString()}>
						{track.name}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</Field.Field>

	<Field.Field class="col-span-2">
		<!-- <Field.Label for="input-id">{m.filters_category()}</Field.Label> -->
		<Select.Root
			type="single"
			bind:value={selectedCategoryId}
			onValueChange={(value) => {
				selectedCategory =
					data.categories?.find((category) => category.id.toString() === value)?.name || null;
				selectedCategoryId = value;
				updateUrl();
			}}
		>
			<Select.Trigger class="w-full">
				{#if selectedCategory}
					{selectedCategory}
				{:else}
					{m.filters_category_placeholder()}
				{/if}
			</Select.Trigger>
			<Select.Content>
				{#each data.categories as category}
					<Select.Item value={category.id.toString()}>
						{category.name}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</Field.Field>
</div>

{#if data.laptimes && data.laptimes.length}
	<table class="w-full mt-6 table-auto text-sm border-collapse">
		<thead>
			<tr class="bg-background">
				<th class="p-2 text-left">#</th>
				<th class="p-2 text-left">Driver</th>
				<th class="p-2 text-left">Car</th>
				<th class="p-2 text-left">Time</th>
			</tr>
		</thead>
		<tbody>
			{#each data.laptimes as entry}
				<tr class="border-t">
					<td class="p-2">{entry.rank}</td>
					<td class="p-2">{entry.driver}</td>
					<td class="p-2">{entry.car_make} {entry.car_model}</td>
					<td class="p-2">{entry.laptime}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p class="mt-6 text-gray-500">No times found for your filter</p>
{/if}

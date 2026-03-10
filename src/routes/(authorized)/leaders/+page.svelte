<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';

    let { data } = $props();
    let selectedTrackId = $state<string|undefined>(undefined)
    let selectedTrack = $state<string|null>(null);
    
</script>

<Select.Root type="single" bind:value={selectedTrackId} onValueChange={(value) => {
    selectedTrack = data.tracks?.find((track) => track.id.toString() === value)?.name || null;
}}>
	<Select.Trigger class="w-full">
		{#if selectedTrack}
            {selectedTrack}
        {:else}
            Select a track
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

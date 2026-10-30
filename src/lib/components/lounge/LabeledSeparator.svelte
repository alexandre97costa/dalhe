<script lang="ts">
	// Grey text label followed by a horizontal line (Sprint 1.5, F6). Used by the session laps
	// (track/car groups) and the session card (sections).
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		label,
		children,
		class: className
	}: {
		// Plain text label ("Brands Hatch · McLaren 720S Evo", "Setup").
		label?: string;
		// Richer label content instead of `label` (an icon plus text, say).
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<div class={cn('text-muted-foreground flex min-w-0 items-center gap-3 text-xs', className)}>
	<span class="min-w-0 shrink truncate">
		{#if children}{@render children()}{:else}{label}{/if}
	</span>
	<span class="bg-border h-px min-w-6 flex-1" aria-hidden="true"></span>
</div>

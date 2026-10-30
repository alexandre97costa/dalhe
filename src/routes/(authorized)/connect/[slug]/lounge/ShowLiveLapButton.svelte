<script lang="ts">
	// "Show live lap" at the bottom of the frozen live lap card (Sprint 1.5, L4, Decision 5).
	// Its background fills over the freeze; with prefers-reduced-motion a countdown replaces
	// the sweep. The accessible name stays "Show live lap" so the countdown isn't announced.
	import { m } from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { onMount } from 'svelte';

	let {
		durationS,
		remainingS,
		onclick
	}: {
		// Length of the freeze (the fill's duration).
		durationS: number;
		// Whole seconds left, for the reduced-motion countdown.
		remainingS: number;
		onclick: () => void;
	} = $props();

	// The sweep starts on mount, with the countdown timer, not when the server HTML is painted.
	let started = $state(false);
	onMount(() => {
		started = true;
	});
</script>

<Button
	variant="outline"
	class="relative w-full overflow-hidden"
	aria-label={m.lounge_show_live_lap()}
	{onclick}
>
	<span
		aria-hidden="true"
		class="sweep bg-primary/25 absolute inset-0 origin-left motion-reduce:hidden"
		class:running={started}
		style:animation-duration="{durationS}s"
	></span>
	<span aria-hidden="true" class="relative motion-reduce:hidden">{m.lounge_show_live_lap()}</span>
	<span aria-hidden="true" class="relative hidden motion-reduce:inline">
		{m.lounge_show_live_lap_countdown({ seconds: remainingS })}
	</span>
</Button>

<style>
	.sweep {
		transform: scaleX(0);
	}

	.sweep.running {
		animation-name: sweep;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}

	@keyframes sweep {
		to {
			transform: scaleX(1);
		}
	}
</style>

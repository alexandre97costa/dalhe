<script lang="ts">
	// A one-line dismissible tip (Sprint 2, U3). Not a modal, not a toast: it stays until the ×.
	// The × posts the tip key to the page's ?/dismissTip action, which stores the dismissal per
	// user. With JS the tip hides at once without reloading the page; without JS the page reloads
	// and the load no longer shows it.
	import type { TipKey } from '$lib/config/tips';
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import { Lightbulb, X } from '@lucide/svelte';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { TransitionConfig } from 'svelte/transition';

	let {
		tipKey,
		message,
		action = '?/dismissTip',
		class: className
	}: { tipKey: TipKey; message: string; action?: string; class?: string } = $props();

	let dismissed = $state(false);

	// Two stages: the tip fades out in place, then shrinks to nothing so the content below slides
	// up instead of jumping. The shrink also pulls back the parent's row gap through a negative
	// margin, or the gap would snap shut at the end. Played backwards when the tip comes back.
	function collapse(node: HTMLElement, { fade = 150, shrink = 200 } = {}): TransitionConfig {
		const style = getComputedStyle(node);
		const px = (value: string) => parseFloat(value) || 0;
		const height = px(style.height);
		const paddingTop = px(style.paddingTop);
		const paddingBottom = px(style.paddingBottom);
		const borderTop = px(style.borderTopWidth);
		const borderBottom = px(style.borderBottomWidth);
		const gap = node.parentElement ? px(getComputedStyle(node.parentElement).rowGap) : 0;

		// t runs 1 → 0 on the way out: the fade takes the top of that range, the shrink the rest.
		const split = shrink / (fade + shrink);
		const clamp = (x: number) => Math.min(1, Math.max(0, x));

		return {
			duration: prefersReducedMotion.current ? 0 : fade + shrink,
			css: (t) => {
				const opacity = clamp((t - split) / (1 - split));
				const size = 1 - cubicOut(clamp(1 - t / split));
				return `
					overflow: hidden;
					opacity: ${opacity};
					height: ${size * height}px;
					padding-top: ${size * paddingTop}px;
					padding-bottom: ${size * paddingBottom}px;
					border-top-width: ${size * borderTop}px;
					border-bottom-width: ${size * borderBottom}px;
					margin-bottom: ${-(1 - size) * gap}px;
				`;
			}
		};
	}
</script>

{#if !dismissed}
	<div
		transition:collapse
		role="note"
		class={cn(
			'flex items-center gap-3 rounded-lg border border-purple-500/40 bg-purple-500/10 py-2 pr-1 pl-3 text-sm',
			className
		)}
	>
		<Lightbulb class="shrink-0 text-purple-400" size="16" aria-hidden="true" />
		<p class="flex-1">{message}</p>
		<form
			method="POST"
			{action}
			use:enhance={() => {
				dismissed = true;
				// Skip the reload: the dismissal is stored, and the next load won't show the tip.
				return async ({ result }) => {
					if (result.type === 'failure' || result.type === 'error') dismissed = false;
				};
			}}
		>
			<input type="hidden" name="tip_key" value={tipKey} />
			<button
				type="submit"
				class="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md p-2 outline-none focus-visible:ring-[3px]"
				aria-label={m.tip_dismiss()}
			>
				<X size="16" aria-hidden="true" />
			</button>
		</form>
	</div>
{/if}

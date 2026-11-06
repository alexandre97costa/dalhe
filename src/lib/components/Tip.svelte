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

	let {
		tipKey,
		message,
		action = '?/dismissTip',
		class: className
	}: { tipKey: TipKey; message: string; action?: string; class?: string } = $props();

	let dismissed = $state(false);
</script>

{#if !dismissed}
	<div
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

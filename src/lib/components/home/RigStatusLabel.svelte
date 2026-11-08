<script lang="ts">
	// A rig's status as a coloured dot plus text (Sprint 2, Decision 7). The dot is decoration; the
	// text carries the meaning, so the status reads the same without colour.
	import type { MyRig } from '$lib/types/home';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';
	import Message from '$lib/components/Message.svelte';

	let { rig, class: className }: { rig: MyRig; class?: string } = $props();

	let kind = $derived(
		!rig.sessionActive ? 'free' : rig.isAnonymous ? 'anonymous' : ('driving' as const)
	);
</script>

<span class={cn('text-muted-foreground inline-flex items-start gap-2 text-sm', className)}>
	<span
		aria-hidden="true"
		class={cn(
			'mt-1.5 size-2 shrink-0 rounded-full',
			kind === 'free' && 'bg-card-foreground/20',
			kind === 'driving' && 'animate-pulse bg-green-500',
			kind === 'anonymous' && 'animate-pulse bg-blue-500'
		)}
	></span>
	<span>
		{#if kind === 'free'}
			{m.home_rig_status_free()}
		{:else if kind === 'anonymous'}
			{m.home_rig_status_anonymous()}
		{:else}
			<Message message={m.home_rig_status_driving} inputs={{ driverName: rig.driverName ?? '' }} />
		{/if}
	</span>
</span>

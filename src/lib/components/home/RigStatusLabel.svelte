<script lang="ts">
	// A rig's status as a coloured dot plus text (Sprint 2, Decision 7). The dot is decoration; the
	// text carries the meaning, so the status reads the same without colour.
	import type { MyRig } from '$lib/types/home';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils';

	let { rig, class: className }: { rig: MyRig; class?: string } = $props();

	let kind = $derived(
		!rig.sessionActive ? 'free' : rig.isAnonymous ? 'anonymous' : ('driving' as const)
	);
	let label = $derived(
		kind === 'free'
			? m.home_rig_status_free()
			: kind === 'anonymous'
				? m.home_rig_status_anonymous()
				: m.home_rig_status_driving({ driverName: rig.driverName ?? '' })
	);
</script>

<span class={cn('text-muted-foreground inline-flex items-start gap-2 text-sm', className)}>
	<span
		aria-hidden="true"
		class={cn(
			'mt-1.5 size-2 shrink-0 rounded-full',
			kind === 'free' && 'bg-emerald-500',
			kind === 'driving' && 'animate-pulse bg-amber-500',
			kind === 'anonymous' && 'animate-pulse bg-sky-500'
		)}
	></span>
	<span>{label}</span>
</span>

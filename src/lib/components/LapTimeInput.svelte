<script lang="ts">
	// A lap or sector time typed as 7 digits (MMSSmmm), shown as MM:SS.mmm.
	// Digits only, so phones open the number keyboard.
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';

	let {
		value = $bindable(''),
		size = 'lg',
		...restProps
	}: {
		value?: string;
		size?: 'lg' | 'sm';
		[key: string]: unknown;
	} = $props();

	const slotClass = $derived(
		cn(
			'size-full font-mono font-normal text-purple-800 dark:text-purple-300',
			size === 'lg' ? 'h-14 text-3xl' : 'h-10 text-xl'
		)
	);
	const separatorClass = $derived(
		cn('font-light text-purple-400', size === 'lg' ? 'text-5xl' : 'text-3xl')
	);
</script>

<InputOTP.Root
	maxlength={7}
	pattern={REGEXP_ONLY_DIGITS}
	inputmode="numeric"
	class="grid grid-cols-[2fr_min-content_2fr_min-content_3fr] gap-1"
	{...restProps}
	bind:value
>
	{#snippet children({ cells })}
		<InputOTP.Group class="grid grid-cols-2">
			{#each cells.slice(0, 2) as cell}
				<InputOTP.Slot {cell} class={slotClass} />
			{/each}
		</InputOTP.Group>
		<InputOTP.Separator class={separatorClass}>:</InputOTP.Separator>
		<InputOTP.Group class="grid grid-cols-2">
			{#each cells.slice(2, 4) as cell}
				<InputOTP.Slot {cell} class={slotClass} />
			{/each}
		</InputOTP.Group>
		<InputOTP.Separator class={separatorClass}>.</InputOTP.Separator>
		<InputOTP.Group class="grid grid-cols-3">
			{#each cells.slice(4, 7) as cell}
				<InputOTP.Slot {cell} class={slotClass} />
			{/each}
		</InputOTP.Group>
	{/snippet}
</InputOTP.Root>

<script>
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';

	title.set(m.nav_add());
</script>

<InputOTP.Root
	maxlength={7}
	pattern={REGEXP_ONLY_DIGITS}
	on:change={(e) => console.log(e.detail.value)}
>
	{#snippet children({ cells })}
		<InputOTP.Group>
			{#each cells.slice(0, 2) as cell}
				<InputOTP.Slot {cell} />
			{/each}
		</InputOTP.Group>
		<InputOTP.Separator>:</InputOTP.Separator>
		<InputOTP.Group>
			{#each cells.slice(2, 4) as cell}
				<InputOTP.Slot {cell} />
			{/each}
		</InputOTP.Group>
		<InputOTP.Separator>.</InputOTP.Separator>
		<InputOTP.Group>
			{#each cells.slice(4, 7) as cell}
				<InputOTP.Slot {cell} />
			{/each}
		</InputOTP.Group>
	{/snippet}
</InputOTP.Root>

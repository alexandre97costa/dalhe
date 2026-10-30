<script lang="ts">
	import type { PageProps } from './$types';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Rig80 from '$lib/images/signo80rig.png';
	import { enhance } from '$app/forms';
	import { TriangleAlert } from '@lucide/svelte';

	let { data, form }: PageProps = $props();

	// After a refused connect, the action sends back the rig status it saw.
	let status = $derived(form?.status ?? data.status);
	let rigName = $derived(status.rig_name);
	let driverName = $derived(status.driver_name);
	// Only after the first press (or a driver change) is the takeover confirmed.
	let confirming = $derived(!!form?.reason && !!status.driver_id);

	$effect(() => {
		title.set(m.rig_connect_title({ rigName }));
	});
</script>

<main class="flex min-h-[calc(100svh-10.5rem)] items-center justify-center">
	<section
		class="bg-card text-card-foreground w-full max-w-xl overflow-hidden rounded-xl border shadow-sm"
		aria-labelledby="rig-name"
	>
		<div class="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
			<p class="text-md text-muted-foreground font-light tracking-wide sm:text-lg">
				{m.rig_connect_label()}
			</p>
			<h1 id="rig-name" class="pb-3 text-5xl font-semibold tracking-tight">
				{rigName}
			</h1>
			<img
				class=" w-75 object-cover p-8 pt-0 opacity-70 mix-blend-exclusion invert"
				src={Rig80}
				alt="Signo 80 rig"
			/>

			{#if form?.reason === 'driver_changed'}
				<p class="text-muted-foreground text-sm">{m.rig_connect_driver_changed()}</p>
			{/if}

			{#if driverName}
				<div
					role="status"
					class="flex w-full flex-col items-center gap-1 rounded-sm bg-amber-600/20 px-3 py-2 text-center"
				>
					<div class="flex items-center gap-2 text-amber-600 dark:text-amber-500">
						<TriangleAlert class="inline-block shrink-0" size="16" />
						<p class="text-sm font-light tracking-wide sm:text-lg">
							{m.rig_connect_driving({ driverName })}
						</p>
					</div>
					{#if confirming}
						<p class="text-foreground text-sm font-semibold">
							{m.rig_connect_confirm_question({ driverName })}
						</p>
					{/if}
				</div>
			{/if}

			<form
				method="POST"
				class="flex w-full flex-col gap-2 sm:flex-row sm:justify-center"
				use:enhance
			>
				<input type="hidden" name="expected_driver_id" value={status.driver_id ?? ''} />
				{#if confirming}
					<input type="hidden" name="confirm" value="yes" />
					<Button type="submit" size="lg" variant="cta" class="w-full sm:w-auto">
						{m.rig_connect_confirm()}
					</Button>
					<Button
						href={`/connect/${status.rig_id}`}
						size="lg"
						variant="outline"
						class="w-full sm:w-auto"
					>
						{m.rig_connect_cancel()}
					</Button>
				{:else}
					<Button type="submit" size="lg" variant="cta" class="w-full sm:w-auto">
						{m.rig_connect_to_rig()}
					</Button>
					<!-- Spectating is just looking: a link, no form post, nothing written. -->
					<Button
						href={`/connect/${status.rig_id}/lounge`}
						size="lg"
						variant="outline"
						class="w-full sm:w-auto"
					>
						{m.rig_spectate()}
					</Button>
				{/if}
			</form>
		</div>
	</section>
</main>

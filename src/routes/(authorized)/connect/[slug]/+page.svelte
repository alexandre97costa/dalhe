<script lang="ts">
	import type { PageProps } from './$types';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Rig80 from '$lib/images/signo80rig.png';
	import { enhance } from '$app/forms';
	import { TriangleAlert } from '@lucide/svelte';

	let { data }: PageProps = $props();
	const rigName = data.rig.name;

	title.set(m.rig_connect_title({ rigName })); 
</script>

<main class="flex min-h-[calc(100svh-10.5rem)] items-center justify-center">
	<section
		class="bg-card text-card-foreground w-full max-w-xl overflow-hidden rounded-xl border shadow-sm"
		aria-labelledby="rig-name"
	>
		<div class="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
			<p id="rig-label" class="text-md text-muted-foreground font-light tracking-wide sm:text-lg">
				{m.rig_connect_label()}
			</p>
			<h1 id="rig-name" class="pb-3 text-5xl font-semibold tracking-tight">
				{rigName}
			</h1>
			<img
			class=" w-75 object-cover p-8 pt-0 mix-blend-exclusion invert opacity-70"
			src={Rig80}
			alt="Signo 80 rig"
			/>
			
			{#if data.rig.profiles?.username && data.rig.profiles?.id !== data?.user?.id}
			<div class="w-full py-2 rounded-sm flex flex-col items-center text-center bg-amber-600/20">
				<div id="rig-label" class="flex items-center gap-2 text-amber-600 dark:text-amber-500">
					<TriangleAlert class="inline-block " size=16 />
					<p class="text-sm font-light tracking-wide sm:text-lg">
						{m.rig_connect_warning()}
					</p>
				</div>
				<span class="font-semibold text-foreground">{data.rig.profiles?.username}</span>
			</div>
			{/if}
			<form method="POST" class="w-full">
				<Button type="submit" size="lg" variant="cta" class="w-full sm:w-auto">
					{m.rig_connect_to_rig()}
				</Button>
			</form>
			
		</div>
	</section>
</main>

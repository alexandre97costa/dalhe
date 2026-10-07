<script lang="ts">
	import type { PageProps } from './$types';
	import { m } from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Rig80 from '$lib/images/signo80rig.png';
	import { enhance } from '$app/forms';

	let { data }: PageProps = $props();
	const rigName = data.rig.name;
</script>

<svelte:head>
	<title>{rigName} | Connect</title>
</svelte:head>

<main class="flex min-h-[calc(100svh-10.5rem)] items-center justify-center">
	<section
		class="bg-card text-card-foreground w-full max-w-xl overflow-hidden rounded-xl border shadow-sm"
		aria-labelledby="rig-name"
	>
		<div class="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
			<h1 id="rig-label" class="text-md text-background-muted font-thin tracking-wide sm:text-lg">
				Estás prestes a conectar-te a:
			</h1>
			<h1 id="rig-name" class="pb-3 text-5xl font-semibold tracking-tight">
				{rigName}
			</h1>
			<img
				class="w-75 object-cover p-8 pt-0 mix-blend-exclusion invert"
				src={Rig80}
				alt="Signo 80 rig"
			/>
			<form method="POST" class="w-full">
				<Button type="submit" size="lg" variant="cta" class="w-full sm:w-auto">
					{m.rig_connect_to_rig()}
				</Button>
			</form>
		</div>
	</section>
</main>

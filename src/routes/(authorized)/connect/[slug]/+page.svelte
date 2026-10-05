<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import RigImg from '$lib/images/simracing_rig.jpeg';
	import Rig80 from '$lib/images/signo80rig.png';

	const rigName = 'Signo 80';
</script>

<svelte:head>
	<title>{rigName} | Connect</title>
</svelte:head>

<main class="flex min-h-[calc(100svh-10.5rem)] items-center justify-center">
	<section
		class="bg-card text-card-foreground w-full max-w-xl overflow-hidden rounded-xl border shadow-sm "
		aria-labelledby="rig-name"
	>
		<img class="w-full object-cover p-8 pb-0 mix-blend-exclusion invert  " src={Rig80} alt="Signo 80 rig" />
		<div class="flex flex-col items-center gap-3 p-6 text-center sm:p-8">
			<h1 id="rig-label" class="text-lg font-thin text-background-muted tracking-wide  sm:text-xl">
				Estás prestes a conectar-te a:
			</h1>
			<h1 id="rig-name" class="text-4xl font-semibold tracking-tight sm:text-3xl pb-3">
				{rigName}
			</h1>
			<Button size="lg" variant="cta" class="w-full sm:w-auto">{m.rig_connect_to_rig()}</Button>
		</div>
	</section>
</main>

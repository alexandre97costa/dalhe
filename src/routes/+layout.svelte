<script>
	import '../app.css';
	import { Button } from '$lib/components/ui/button/index';
	import LightSwitch from '$lib/components/LightSwitch.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import LogoImg from '$lib/500w.png';

	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';

	let { children } = $props();

	let language = $state(getLocale());

	function toggleLanguage() {
		language = language == 'en' ? 'pt' : 'en';
		setLocale(language);
	}
</script>

<div class="bg-background fixed top-0 right-0 left-0 flex justify-between border-b-1 px-1 py-2">
	<div class="flex items-center gap-2">
		<Button
			href="/"
			variant="ghost"
			size="lg"
			class="group hover:bg-popover hover:dark:bg-popover p-2"
		>
			<img src={LogoImg} alt="logo" class=" max-w-8" />
			<!-- <div class="h-[36px] w-[36px] flex items-center justify-center bg-neutral-950 p-1.5 rounded-md border-1 border-neutral-500">
			</div> -->
			<!-- <span class="hidden group-hover:inline">
				daaaaaaa-lhe
				</span> -->
		</Button>

		<div class="flex flex-col">

			<h1 class="text-xl font-semibold">Perfil</h1>
			<h2 class="text-xs text-neutral-500">alexandre97costa</h2>
		</div>
	</div>
	<div class="flex items-center gap-2 pr-3">
		<Button
			onclick={toggleLanguage}
			variant="outline"
			size="icon"
			class="dark:bg-popover cursor-pointer"
		>
			<span class="h-[1.2rem] w-[1.2rem] scale-100">
				{#if language == 'en'}
					EN
				{:else}
					PT
				{/if}
			</span>
			<span class="sr-only">Toggle language</span>
		</Button>
		<LightSwitch />
		<ModeWatcher />
	</div>
</div>

<div class="container mx-auto mt-14 h-full p-4">
	{@render children?.()}
</div>

<div class="fixed w-full right-0 bottom-0 left-0 flex justify-center">
	<Nav />
</div>

<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import { title } from '$lib/store.js';
	import type { LayoutProps } from './$types';
	import type { LayoutServerLoad } from './$types';
	import type { WithChildren } from 'bits-ui';
	import { ModeWatcher } from 'mode-watcher';
	
	import { Button } from '$lib/components/ui/button/index';
	import LightSwitch from '$lib/components/LightSwitch.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import New from '$lib/components/New.svelte';
	import LogoImg from '$lib/500w.png';


	onMount(async () => {
		const { data: { session }, error } = await supabase.auth.getSession();
		if (error) {
			console.error('Error getting session:', error.message);
		} else {
			console.log('Session data:', session);
		}
	});

	let { data, children }: LayoutProps = $props();

	let open = $state(false);
	let language = $state(getLocale());

	function toggleLanguage() {
		language = language == 'en' ? 'pt' : 'en';
		setLocale(language);
	}
</script>

<svelte:head>
	<title>{$title ? $title + ' | Dá-lhe!' : 'Dá-lhe!'}</title>
</svelte:head>

<div
	class="bg-background/20 fixed top-0 right-0 left-0 flex justify-between border-b px-1 py-2 backdrop-blur-sm"
>
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
			<h1 class="text-xl font-semibold">{$title}</h1>
			<!-- <h2 class="text-xs text-neutral-500">alexandre97costa</h2> -->
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

<div class="h- container mx-auto mt-14 p-4">
	{@render children?.()}
</div>

<div class="fixed right-0 bottom-0 left-0 flex w-full justify-center">
	<Nav bind:open />
	<New bind:open {data} />
</div>

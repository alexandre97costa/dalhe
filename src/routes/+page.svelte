<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';

	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import LightSwitch from '$lib/components/LightSwitch.svelte';
	import UserSession from '$lib/components/UserSession.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import New from '$lib/components/New.svelte';
	import LogoImg from '$lib/images/500w.png';
	import LogoTypeImg from '$lib/images/dalhe.svg';

	title.clear();

	let language = $state(getLocale());
	function toggleLanguage() {
		language = language == 'en' ? 'pt' : 'en';
		setLocale(language);
	}
</script>

<div
	class="fixed top-0 right-0 left-0 flex justify-between border-b bg-zinc-100 px-4 py-4 backdrop-blur-sm dark:bg-zinc-900"
>
	<div class="flex items-center gap-8">
		<Button
			href="/"
			variant="ghost"
			size="lg"
			class="group hover:bg-popover hover:dark:bg-popover flex gap-8 p-2"
		>
			<img src={LogoImg} alt="logo" class=" max-h-8" />
			<img src={LogoTypeImg} alt="logo" class="h-8" />
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
	<div class="flex items-center gap-2">
		<Button
			onclick={toggleLanguage}
			variant="outline"
			size="icon"
			class="dark:bg-background  cursor-pointer"
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
		<UserSession />
		<ModeWatcher />
	</div>
</div>

<div class="h- container mx-auto mt-40 p-4">
	<div class="scroll-m-20 pb-4 text-6xl font-bold tracking-normal text-balance">
		Keep yourself <span class="gradient-text">on track.</span>
	</div>

	<p class="text-xl font-medium">{m.hello_world()}</p>

	<br />
	<p>Current challenge:</p>
	<ul class="list-inside list-disc">
		<li>User Session</li>
	</ul>
</div>

<style>
	.gradient-text {
		background: linear-gradient(to right, #e9d5ff, #923ce2);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
</style>

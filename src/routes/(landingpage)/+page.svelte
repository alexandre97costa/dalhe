<script lang="ts">
	// svelte imports
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import type { ActionData } from './$types.js';
	import { invalidate } from '$app/navigation';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import { ModeWatcher } from 'mode-watcher';
	import '../../app.css';

	// shadcn ui
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	// components
	import LightSwitch from '$lib/components/LightSwitch.svelte';
	import UserSession from '$lib/components/UserSession.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import New from '$lib/components/New.svelte';
	import LoginForm from './LoginForm.svelte';

	// images
	import LogoImg from '$lib/images/500w.png';
	import LogoTypeImg from '$lib/images/dalhe.svg';

	title.clear();
	interface Props {
		form: ActionData;
	}
	let { form }: Props = $props();
	let language = $state(getLocale());
	let open = $state(false);
	const isDesktop = new MediaQuery('(min-width: 768px)');

	function toggleLanguage() {
		language = language == 'en' ? 'pt' : 'en';
		setLocale(language);
	}
</script>

<svelte:head>
	<title>User Management</title>
</svelte:head>

<div
	class="fixed top-0 right-0 left-0 flex justify-between border-b bg-zinc-100 p-3 backdrop-blur-sm dark:bg-zinc-950"
>
	<div class="flex items-center gap-8">
		<Button
			href="/"
			variant="ghost"
			size="lg"
			class="group hover:bg-popover hover:dark:bg-popover flex gap-8 p-2"
		>
			<img src={LogoImg} alt="logo" class=" max-h-6" />
			<!-- <img src={LogoTypeImg} alt="logo" class="h-8" /> -->
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
		<!-- <UserSession /> -->
		<ModeWatcher />

		{#if isDesktop.current}
			<Popover.Root bind:open>
				<!-- todo: hover e dark e resto dos states do botão de login -->
				<Popover.Trigger class={buttonVariants({ variant: 'default', size: 'sm' }) + ' border-purple-600 border bg-purple-500/20 text-white'}>
					{m.login_button()}
				</Popover.Trigger>
				<Popover.Content class="w-80 p-5">
					<LoginForm {form} />
				</Popover.Content>
			</Popover.Root>
		{:else}
			<Dialog.Root bind:open>
				<!-- todo: copiar para aqui o botão de login (quando estiver concluido) -->
				<Dialog.Trigger class={buttonVariants({ variant: 'default' })}
					>{m.login_button()}</Dialog.Trigger
				>
				<Dialog.Content>
					<LoginForm {form} />
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	</div>
</div>

<div class="h- container mx-auto mt-40 p-4">
	<div class="scroll-m-20 pb-4 text-6xl font-bold tracking-normal text-balance">
		Keep yourself <span class="gradient-text">on track.</span>
	</div>
</div>

<style>
	.gradient-text {
		background: linear-gradient(to right, #e9d5ff, #923ce2);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
</style>

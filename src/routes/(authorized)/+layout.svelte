<script lang="ts">
	import type { LayoutProps } from './$types';
	import type { LayoutServerLoad } from './$types';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { title } from '$lib/store.js';

	import '../../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import UserSession from '$lib/components/UserSession.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import New from '$lib/components/New.svelte';
	import LogoImg from '$lib/images/500w.png';

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => data.subscription.unsubscribe();
	});

	let { data, children }: LayoutProps = $props();
	let { supabase, session, user, laptimeForm, formDataRecord } = $derived(data);

	let open = $state(false);

	$effect(() => {
		console.log(data);
	});
</script>

<svelte:head>
	<title>{$title ? $title + ' | Dá-lhe!' : 'Dá-lhe!'}</title>
</svelte:head>

<Toaster />
<ModeWatcher />
<div
	class="fixed z-10 top-0 right-0 left-0 flex justify-between border-b bg-zinc-100 px-1 py-2 backdrop-blur-sm dark:bg-zinc-900"
>
	<div class="flex items-center gap-2">
		<Button
			href="/"
			variant="ghost"
			size="lg"
			class="group hover:bg-popover hover:dark:bg-popover p-2"
		>
			<img src={LogoImg} alt="logo" class=" max-w-8" />
		</Button>

		<div class="flex flex-col">
			<h1 class="text-xl font-semibold">{$title}</h1>
		</div>
	</div>
	<div class="flex items-center gap-1.5 pr-1">

		<UserSession {user} />
	</div>
</div>

<div class="h- container mx-auto mt-14 mb-20 px-4 py-4 ">
	{@render children?.()}
</div>

<div class="fixed right-0 bottom-0 left-0 flex w-full justify-center">
	<Nav bind:open />
	<New bind:open data={{ laptimeForm, formDataRecord }} />
</div>

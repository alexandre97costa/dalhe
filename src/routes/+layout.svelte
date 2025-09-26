<script>
	import '../app.css';
	import { Button } from '$lib/components/ui/button/index';
	import LightSwitch from '$lib/components/LightSwitch.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import LogoImg from '$lib/500w.png';

	let { children } = $props();
</script>

<div class="fixed top-0 left-0 right-0 flex justify-between px-1 py-2 ">
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
	<ModeWatcher />
	<div class="pr-3">
		<LightSwitch />
	</div>
</div>

<div class="container mt-14 h-full p-2 bg-neutral-800">
	{@render children?.()}
</div>

<div class="fixed bottom-0 left-0 right-0 bg-amber-300">
	<Nav />
</div>
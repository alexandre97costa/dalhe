<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<Nav />

<div class="h-full container mx-auto my-10">
	{@render children?.()}
</div>

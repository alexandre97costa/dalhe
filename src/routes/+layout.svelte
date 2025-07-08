<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<Nav />

{@render children?.()}

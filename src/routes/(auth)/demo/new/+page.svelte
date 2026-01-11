<script lang="ts">
	import type { PageData } from './$types.js';
	import SettingsForm from './form.svelte';
	let { data }: { data: PageData } = $props();
</script>

<SettingsForm {data} />

<script lang="ts">
	import '../../app.css'
	import { invalidate } from '$app/navigation'
	import { onMount } from 'svelte'
	import { Button } from "$lib/components/ui/button/index.js";

	let { data, children } = $props()
	let { supabase, session } = $derived(data)

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth')
			}
		})

		return () => data.subscription.unsubscribe()
	})
</script>

<svelte:head>
	<title>Dá-lhe!</title>
</svelte:head>

<div class="container h-full" style="padding: 50px 0 500px 0">
	{@render children()}

</div>
<Button variant="link" href="/privacy-policy">Privacy Policy</Button>

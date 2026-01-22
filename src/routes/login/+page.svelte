<script lang="ts">
	import type { ActionData } from './$types.js';
	import LoginForm from '../../lib/components/LoginForm.svelte';
	import '../../app.css';

	interface Props {
		form: ActionData;
	}
	let { form }: Props = $props();
</script>

<div class="flex min-h-screen items-center justify-center">
	<LoginForm {form} />
</div>

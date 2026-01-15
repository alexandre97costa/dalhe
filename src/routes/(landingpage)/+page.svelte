<script lang="ts">
    import LoginForm from './LoginForm.svelte';
    import type { ActionData } from './$types.js';

    interface Props {
        form: ActionData;
    }
    let { form }: Props = $props();
</script>

<svelte:head>
    <title>User Management</title>
</svelte:head>

<LoginForm {form} />
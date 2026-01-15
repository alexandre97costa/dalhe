<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData, SubmitFunction } from './$types.js';
    import { Button } from '$lib/components/ui/button/index';

    interface Props {
        form: ActionData;
    }

    let { form }: Props = $props();
    let loading = $state(false);

    const handleSubmit: SubmitFunction = () => {
        loading = true;
        return async ({ update }) => {
            update();
            loading = false;
        };
    };
</script>

<form class="row flex-center flex" method="POST" use:enhance={handleSubmit}>
    <div class="form-widget col-6">
        <h1 class="header">Supabase + SvelteKit</h1>
        <p class="description">Sign in via magic link with your email below</p>
        {#if form?.message !== undefined}
            <div class="success {form?.success ? '' : 'fail'}">
                {form?.message}
            </div>
        {/if}
        <div>
            <label for="email">Email address</label>
            <input
                id="email"
                name="email"
                class="inputField"
                type="email"
                placeholder="Your email"
                value={form?.email ?? ''}
            />
        </div>
        {#if form?.errors?.email}
            <span class="error flex items-center text-sm">
                {form?.errors?.email}
            </span>
        {/if}
        <Button type="submit" class="mt-4 w-full" disabled={loading}>
            {loading ? 'Loading' : 'Send magic link'}
        </Button>

    </div>
</form>
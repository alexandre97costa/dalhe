<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, SubmitFunction } from './$types.js';
	import { m } from '$lib/paraglide/messages.js';

	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

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

<form class="" method="POST" use:enhance={handleSubmit}>
	<Field.Group>
		<Field.Set>
			<Field.Legend>Login/Signup</Field.Legend>
			<Field.Description>{m.formlogin_description()}</Field.Description>

			{#if form?.message !== undefined}
				{#if form?.success === true}
					<Card.Root class="rounded-md border-0 bg-lime-500/15 px-3 py-2 text-sm text-lime-100">
						<Card.Content class="p-0">
							<p>{form?.message ?? 'Success'}</p>
						</Card.Content>
					</Card.Root>
				{:else}
					<Card.Root class="rounded-md border-0 bg-red-500/10 px-3 py-2 text-sm text-rose-100">
						<Card.Content class="p-0">
							<p>{form?.message ?? 'Error'}</p>
						</Card.Content>
					</Card.Root>
				{/if}
			{/if}

			<Field.Field>
				<Field.Label for="email">Email</Field.Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="verstappen@redbull.com"
					required
					value={form?.email ?? ''}
				/>
				{#if form?.errors?.email}
					<Field.Error>{form?.errors?.email}</Field.Error>
				{/if}
			</Field.Field>
		</Field.Set>
		<Button type="submit" class="w-full" disabled={loading || form?.success}>
			{#if loading}
				<Spinner />
				{m.loading()}
			{:else}
				{m.formlogin_submit_button()}
			{/if}
		</Button>
	</Field.Group>
</form>

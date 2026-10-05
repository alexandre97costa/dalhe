<!-- Card que mostra a foto do driver e o username -->
<!-- Quando o user for o em sessão, pode editar o nome e foto (duas ações diferentes) -->

<script lang="ts">
	// types
	import { type Infer, superForm, type SuperValidated, superValidate } from 'sveltekit-superforms';
	import { driverSchema, type DriverSchema } from '$lib/schemas/driverSchema';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { DriverProfileProps } from '$lib/types/listings';

	import { m } from '$lib/paraglide/messages.js';
	import { toast } from 'svelte-sonner';

	// ui
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Turtle, Save, X, UserRoundPen } from '@lucide/svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let { driverForm, username, photoUrl, bio, isCurrentUser }: DriverProfileProps = $props();
	let open = $state(false);
	let isFormLoading = $state(false);

	const form = superForm(driverForm, {
		validators: zod4(driverSchema),
		// SPA: false,
		onUpdate: ({ form, result }) => {
			if (form.valid) {
				isFormLoading = false;
			}

			if (result?.data?.success === false) {
				toast.error('Failed to submit lap time. Please try again.');
			}
		}
	});
	const { form: formData, enhance } = form;
</script>

<div class="mt-4 flex flex-col items-center gap-2">
	<Avatar.Root class="size-20 border-0 border-rose-400">
		<Avatar.Image src={photoUrl} alt={username} />
		<Avatar.Fallback class="bg-linear-to-t from-purple-600 to-purple-400">
			<Turtle class="mb-0.5 ml-1 size-12 text-white" strokeWidth={1.5} />
		</Avatar.Fallback>
	</Avatar.Root>

	<div class="flex flex-col items-center gap-1">
		<h2 class="text-2xl font-semibold">{username}</h2>
		<h2 class="text-md font-regular text-muted-foreground italic">
			{bio ? `"${bio}"` : 'Este usuário não tem uma bio.'}
		</h2>
	</div>
</div>
{#if isCurrentUser}
	<div class="mt-3 flex justify-center">
		<Button variant="cta" size="default" class="" onclick={() => (open = true)}>
			<!-- <span>Editar</span> -->
			<!-- <Pencil class="size-4" /> -->
			<UserRoundPen class="size-5" />
			{m.formdriver_header()}
		</Button>
	</div>
{/if}

<Dialog.Root bind:open>
	<Dialog.Content class="border-muted-foreground/30 dark:bg-muted border-2 bg-white">
		<Dialog.Header>
			<Dialog.Title>{m.formdriver_header()}</Dialog.Title>
			<Separator class="mt-4 mb-2" />
		</Dialog.Header>

		<form
			method="POST"
			action="/new"
			class=" grid items-start gap-5"
			use:enhance
			onsubmit={() => (isFormLoading = true)}
		>
			<!-- Driver avatar -->

			<div class="flex items-center gap-4">
				<Form.Field {form} name="avatar" class="flex-1">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>
								{m.formdriver_avatar_label()}
							</Form.Label>
							<Input type="file" {...props} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Avatar.Root class="size-16 border-0 border-rose-400">
					<Avatar.Image src={photoUrl} alt={username} />
					<Avatar.Fallback class="bg-linear-to-t from-purple-600 to-purple-400">
						<Turtle class="mb-0.5 ml-1 size-12 text-white" strokeWidth={1.5} />
					</Avatar.Fallback>
				</Avatar.Root>
			</div>

			<!-- Driver name -->
			<Form.Field {form} name="username">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>
							{m.formdriver_username_label()}
						</Form.Label>
						<Input {...props} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Driver bio -->
			<Form.Field {form} name="bio">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>
							{m.formdriver_bio_label()}
						</Form.Label>
						<Textarea rows={4} {...props} placeholder={m.formdriver_bio_placeholder()} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Buttons -->
			<div class="flex justify-center gap-4">
				<Button
					disabled={isFormLoading}
					variant="outline"
					size="lg"
					class="flex-1"
					onclick={() => (open = false)}
				>
					<!-- <span>Salvar</span> -->
					<X class="size-5" />
					{m.formdriver_cancel_button()}
				</Button>
				<Button
					type="submit"
					disabled={isFormLoading}
					variant="cta"
					size="lg"
					class="flex-1"
					onclick={() => {
						isFormLoading = true;
						toast.promise<{ name: string }>(
							() =>
								new Promise((resolve) =>
									setTimeout(() => {
										open = false;
										resolve({ name: 'Event' });
									}, 2000)
								),
							{
								loading: 'Loading...',
								success: (data) => `${data.name} has been created`,
								error: 'Error'
							}
						);
					}}
				>
					<Save class="size-5" />
					{m.formdriver_submit_button()}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Card que mostra a foto do driver e o username -->
<!-- Quando o user for o em sessão, pode editar o nome e foto (duas ações diferentes) -->

<script lang="ts">
	// types
	import { type Infer, superForm, type SuperValidated, superValidate } from 'sveltekit-superforms';
	import { driverSchema, type DriverSchema } from '$lib/schemas/driverSchema';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { DriverProfileProps } from '$lib/types/listings';

	// ui
	import { m } from '$lib/paraglide/messages.js';
	import { toast } from 'svelte-sonner';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Turtle, Save, X, UserRoundPen } from '@lucide/svelte';

	let props: DriverProfileProps = $props();
	let isEditing = $state(false);
	let isFormLoading = $state(false);

	const form = superForm(props.driverForm, {
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

	const handleEditProfile = () => {
		// Lógica para editar o perfil do driver
		isEditing = true;
		console.log('Editar perfil do driver');
	};
</script>

{#if !isEditing}
	<div class="mt-4 flex flex-col items-center gap-2">
		<Avatar.Root class="size-20 border-0 border-rose-400">
			<Avatar.Image src={props.photoUrl} alt={props.username} />
			<Avatar.Fallback class="bg-linear-to-t from-purple-600 to-purple-400">
				<Turtle class="mb-0.5 ml-1 size-12 text-white" strokeWidth={1.5} />
			</Avatar.Fallback>
		</Avatar.Root>

		<div class="flex flex-col items-center gap-1">
			<h2 class="text-2xl font-semibold">{props.username}</h2>
			<h2 class="text-md font-regular text-muted-foreground italic">
				{props.bio ? `"${props.bio}"` : 'Este usuário não tem uma bio.'}
			</h2>
		</div>
	</div>
{/if}

{#if isEditing}
	<form
		method="POST"
		action="/new"
		class="grid items-start gap-4 mt-5"
		use:enhance
		onsubmit={() => (isFormLoading = true)}
	>
		<h1 class="text-lg leading-none font-semibold">{m.formdriver_header()}</h1>
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

		<!-- Buttons -->
		<div class="flex justify-center gap-4">
			<Button variant="outline" size="lg" class="flex-1" onclick={() => (isEditing = false)}>
				<!-- <span>Salvar</span> -->
				<X class="size-5" />
				{m.formdriver_cancel_button()}
			</Button>
			<Button
				variant="cta"
				size="lg"
				class="flex-1"
				onclick={() => {
					isEditing = false;
					toast.promise<{ name: string }>(
						() => new Promise((resolve) => setTimeout(() => resolve({ name: 'Event' }), 2000)),
						{
							loading: 'Loading...',
							success: (data) => `${data.name} has been created`,
							error: 'Error'
						}
					);
				}}
			>
				<!-- <span>Salvar</span> -->
				<Save class="size-5" />
				{m.formdriver_submit_button()}
			</Button>
		</div>
	</form>
{:else if props.isCurrentUser}
	<div class="mt-3 flex justify-center">
		<Button variant="cta" size="default" class="" onclick={handleEditProfile}>
			<!-- <span>Editar</span> -->
			<!-- <Pencil class="size-4" /> -->
			<UserRoundPen class="size-5" />
			{m.formdriver_header()}
		</Button>
	</div>
{/if}

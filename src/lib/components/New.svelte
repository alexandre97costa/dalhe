<script lang="ts">
	import { type LayoutServerLoad } from '../../routes/$types';
	import { m } from '$lib/paraglide/messages.js';
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import { laptimeSchema, type LaptimeSchema } from '$lib/schemas/laptimeSchema';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Field } from 'formsnap';
	// import PUBLIC_SHOW_DESCRIPTIONS from '$env/static/public';
	import FormField from './ui/form/form-field.svelte';

	let {
		data,
		open = $bindable(false)
	}: {
		data: { laptimeForm: SuperValidated<Infer<LaptimeSchema>>; car_make: [] };
		open: boolean;
	} = $props();

	const isDesktop = new MediaQuery('(min-width: 768px)');

	const form = superForm(data.laptimeForm, {
		validators: zod4(laptimeSchema),
		SPA: true,
		onUpdate: ({ form }) => {
			if (form.valid) {
				console.table(form.data);
			} else {
				console.error('Please fix the errors in the form.');
			}
		}
	});

	const { form: formData, enhance } = form;

	$effect(() => {
		console.log($formData);
	});
</script>

<!-- Form -->
{#snippet laptimeForm()}
	<form method="POST" use:enhance class="grid items-start gap-4">
		<Form.Field {form} name="laptime">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{m.formadd_laptime_label()}</Form.Label>
					<InputOTP.Root
						maxlength={7}
						pattern={REGEXP_ONLY_DIGITS}
						{...props}
						bind:value={$formData.laptime}
					>
						{#snippet children({ cells })}
							<InputOTP.Group>
								{#each cells.slice(0, 2) as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator>:</InputOTP.Separator>
							<InputOTP.Group>
								{#each cells.slice(2, 4) as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator>.</InputOTP.Separator>
							<InputOTP.Group>
								{#each cells.slice(4, 7) as cell}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
				{/snippet}
			</Form.Control>
			<!-- <Form.Description>{m.formadd_laptime_placeholder()}</Form.Description> -->
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="car_make">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Marca</Form.Label>

					<Select.Root type="single" bind:value={$formData.car_make}>
						<Select.Trigger class="w-full">
							{$formData.car_make ? $formData.car_make : 'Marca do carro'}
						</Select.Trigger>
						<Select.Content>
							{#each data.car_make as make}
								<Select.Item value={make.name}>{make.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
		</Form.Field>
		<Button type="submit">{m.nav_add_save()}</Button>
	</form>
{/snippet}

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Content class="">
			<Dialog.Header>
				<Dialog.Title>{m.nav_add()}</Dialog.Title>
			</Dialog.Header>
			{@render laptimeForm()}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class="">
			{@render laptimeForm()}
		</Drawer.Content>
	</Drawer.Root>
{/if}

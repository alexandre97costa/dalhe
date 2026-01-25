<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { type Infer, superForm, type SuperValidated, superValidate } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import { laptimeSchema, type LaptimeSchema } from '$lib/schemas/laptimeSchema';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Field } from 'formsnap';
	import FormField from './ui/form/form-field.svelte';
	import type { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'
	// import PUBLIC_SHOW_DESCRIPTIONS from '$env/static/public';
	// import { type CarMake, type CarModel } from '../../routes/+layout.server';
	import type  {  FormDataRecord } from '../../app.d.ts';


	let {
		data,
		open = $bindable(false)
	}: {
		data: {
			laptimeForm: SuperValidated<Infer<LaptimeSchema>>;
			formDataRecord: FormDataRecord;
		};
		open: boolean;
	} = $props();

	let car_makes = $derived(data.formDataRecord.carMakes ?? []);
	let car_models = $derived(data.formDataRecord.cars ?? []);
	let race_tracks = $derived(data.formDataRecord.raceTracks ?? []);

	const isDesktop = new MediaQuery('(min-width: 768px)');
	let selectedCarMake = $state<string | null>(null);
	let selectedCarModel = $state<string | null>(null);
	let selectedCarMakeModels = $state<any[]>([]);
	let selectedTrack = $state<string | null>(null);
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
		console.log(data);
	});

	// car makes select
	$effect(() => {
		let pos = car_makes.findIndex((make: any) => make.id.toString() === $formData.car_make);
		selectedCarMake = car_makes[pos]?.name;
		selectedCarMakeModels = car_models.filter(
			(model: any) => model.make_id.toString() === $formData.car_make
		);
	});

	// car models select
	$effect(() => {
		let pos = car_models.findIndex((model: any) => model.id.toString() === $formData.car_model);
		selectedCarModel = car_models[pos]?.name;
	});

	// race track select
	$effect(() => {
		let pos = race_tracks.findIndex((track: any) => track.id.toString() === $formData.race_track);
		selectedTrack = race_tracks[pos]?.name;
	});
</script>

<!-- Form -->
{#snippet laptimeForm()}
	<form method="POST" use:enhance class="grid items-start gap-4">
		<!-- Laptime -->
		<Form.Field {form} name="laptime">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{m.formadd_laptime_label()}</Form.Label>
					<InputOTP.Root
						maxlength={7}
						pattern={REGEXP_ONLY_DIGITS}
						class="grid grid-cols-[2fr_min-content_2fr_min-content_3fr] gap-1"
						{...props}
						bind:value={$formData.laptime}
					>
						{#snippet children({ cells })}
							<InputOTP.Group class="grid grid-cols-2">
								{#each cells.slice(0, 2) as cell}
									<InputOTP.Slot {cell} class="size-full h-14 text-3xl font-semibold text-purple-300 font-mono" />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator class="text-5xl text-purple-400 font-light">:</InputOTP.Separator>
							<InputOTP.Group class="grid grid-cols-2">
								{#each cells.slice(2, 4) as cell}
									<InputOTP.Slot {cell} class="size-full h-14 text-3xl font-semibold text-purple-300 font-mono" />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator class="text-5xl text-purple-400 font-light">.</InputOTP.Separator>
							<InputOTP.Group class="grid grid-cols-3">
								{#each cells.slice(4, 7) as cell}
									<InputOTP.Slot {cell} class="size-full h-14 text-3xl font-semibold text-purple-300 font-mono" />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
				{/snippet}
			</Form.Control>
			<!-- <Form.Description>{m.formadd_laptime_placeholder()}</Form.Description> -->
			<Form.FieldErrors />
		</Form.Field>

		<!-- Car -->
		<div class="grid grid-cols-2 items-end gap-3">
			<Form.Field {form} name="car_make">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.formadd_car_make_label()}</Form.Label>
						<Select.Root
							type="single"
							bind:value={$formData.car_make}
							onValueChange={() => {
								$formData.car_model = '';
								selectedCarModel = null;
							}}
							{...props}
						>
							<Select.Trigger class="placeholder w-full">
								{$formData.car_make ? selectedCarMake : m.formadd_car_make_placeholder()}
							</Select.Trigger>
							<Select.Content>
							{#each car_makes as make}
									<Select.Item value={make.id.toString()}>
										{make.name}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="car_model">
				<Form.Control>
					{#snippet children({ props })}
						<Select.Root
							type="single"
							bind:value={$formData.car_model}
							{...props}
							disabled={!$formData.car_make}
						>
							<Select.Trigger class="placeholder w-full">
								{$formData.car_model ? selectedCarModel : m.formadd_car_model_placeholder()}
							</Select.Trigger>
							<Select.Content>
								{#each selectedCarMakeModels as model}
									<Select.Item value={model.id.toString()} class="">
										<Badge
											class="h-4 min-w-5 rounded-full bg-purple-600 px-1 font-mono text-[0.6rem] tabular-nums"
											variant="secondary">{model.category.name}</Badge
										>
										<div class="">{model.name}</div>
										<div class="text-gray-500">{model.year}</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Race Track -->
		<Form.Field {form} name="race_track">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{m.formadd_race_track_label()}</Form.Label>
					<Select.Root
						type="single"
						bind:value={$formData.race_track}
						{...props}
					>
						<Select.Trigger class="w-full">
							{$formData.race_track ? selectedTrack : m.formadd_race_track_placeholder()}
						</Select.Trigger>
						<Select.Content>
						{#each race_tracks as track}
								<Select.Item value={track.id.toString()}>
									{track.name}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
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

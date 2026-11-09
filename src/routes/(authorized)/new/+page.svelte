<script lang="ts">
	// Manual laps fallback (app_settings.manual_laps_enabled). See docs/decisions/manual-laps.md.
	import { m } from '$lib/paraglide/messages.js';
	import { title } from '$lib/store.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { manualLapSchema } from '$lib/schemas/manualLapSchema';
	import { digitsToMilliseconds, formatLaptime, lastSectorMilliseconds } from '$lib/utils/laptime';
	import { cn } from '$lib/utils.js';
	import { ArrowLeft, Car, Gamepad2, MapPin, Save, Timer } from '@lucide/svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import LapTimeInput from '$lib/components/LapTimeInput.svelte';

	title.set(m.manuallap_title());

	let { data } = $props();

	const form = superForm(data.form, {
		validators: zod4(manualLapSchema),
		// The server clears the times and keeps game, track and car after a save.
		resetForm: false,
		onUpdated: ({ form }) => {
			if (form.message === 'created') toast.success(m.manuallap_success());
			else if (form.message === 'disabled') toast.error(m.manuallap_error_disabled());
			else if (form.message === 'error') toast.error(m.manuallap_error_generic());
		},
		onError: () => {
			toast.error(m.manuallap_error_generic());
		}
	});
	const { form: formData, enhance, submitting } = form;

	const nameOf = (list: { id: number; name: string }[], id: string) =>
		list.find((item) => String(item.id) === id)?.name;

	const modelsOfMake = $derived(
		data.cars.filter((car) => String(car.make_id) === $formData.make_id)
	);
	const selectedCar = $derived(data.cars.find((car) => String(car.id) === $formData.car_id));

	// S3 is the rest of the lap once the lap, S1 and S2 are typed in.
	const s3Ms = $derived(
		lastSectorMilliseconds(
			digitsToMilliseconds($formData.laptime),
			digitsToMilliseconds($formData.s1),
			digitsToMilliseconds($formData.s2)
		)
	);

	function goBack() {
		if (history.length > 1) history.back();
		else location.href = '/home';
	}
</script>

{#snippet label(Icon: typeof Car, text: string)}
	<Icon size="18" class="text-muted-foreground" />
	{text}
{/snippet}

<div class="mx-auto flex max-w-md flex-col gap-6">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold">{m.manuallap_title()}</h1>
		<p class="text-muted-foreground text-sm">{m.manuallap_description()}</p>
	</div>

	<form method="POST" class="grid items-start gap-5" use:enhance>
		<!-- Game: starts selected when the catalog has only one -->
		<Form.Field {form} name="game_id">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{@render label(Gamepad2, m.manuallap_game_label())}</Form.Label>
					<Select.Root type="single" bind:value={$formData.game_id} {...props}>
						<Select.Trigger class="w-full">
							{nameOf(data.games, $formData.game_id) ?? m.manuallap_game_placeholder()}
						</Select.Trigger>
						<Select.Content>
							{#each data.games as game (game.id)}
								<Select.Item value={String(game.id)}>{game.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<!-- Track -->
		<Form.Field {form} name="track_id">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{@render label(MapPin, m.manuallap_track_label())}</Form.Label>
					<Select.Root type="single" bind:value={$formData.track_id} {...props}>
						<Select.Trigger class="w-full">
							{nameOf(data.tracks, $formData.track_id) ?? m.manuallap_track_placeholder()}
						</Select.Trigger>
						<Select.Content>
							{#each data.tracks as track (track.id)}
								<Select.Item value={String(track.id)}>{track.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<!-- Car: the make filters the models -->
		<div class="grid grid-cols-2 items-start gap-4">
			<Form.Field {form} name="make_id">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{@render label(Car, m.manuallap_make_label())}</Form.Label>
						<Select.Root
							type="single"
							bind:value={$formData.make_id}
							onValueChange={() => ($formData.car_id = '')}
							{...props}
						>
							<Select.Trigger class="w-full">
								{nameOf(data.makes, $formData.make_id) ?? m.manuallap_make_placeholder()}
							</Select.Trigger>
							<Select.Content>
								{#each data.makes as make (make.id)}
									<Select.Item value={String(make.id)}>{make.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="car_id">
				<Form.Control>
					{#snippet children({ props })}
						<!-- Same height as the Make label, which has an icon -->
						<Form.Label class="min-h-4.5">{m.manuallap_car_label()}</Form.Label>
						<Select.Root
							type="single"
							bind:value={$formData.car_id}
							{...props}
							disabled={!$formData.make_id}
						>
							<Select.Trigger class="w-full">
								<span class="truncate">
									{#if selectedCar}
										{selectedCar.model}
									{:else if $formData.make_id}
										{m.manuallap_car_placeholder()}
									{:else}
										{m.manuallap_car_placeholder_no_make()}
									{/if}
								</span>
							</Select.Trigger>
							<Select.Content>
								{#each modelsOfMake as car (car.id)}
									<Select.Item value={String(car.id)}>
										{car.model}
										<span class="text-muted-foreground">{car.year}</span>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Lap time -->
		<Form.Field {form} name="laptime">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>{@render label(Timer, m.manuallap_laptime_label())}</Form.Label>
					<LapTimeInput {...props} bind:value={$formData.laptime} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<!-- Sectors: S1 and S2 typed, S3 computed -->
		<fieldset class="grid gap-3">
			<legend class="mb-1 text-sm font-medium">{m.manuallap_sectors_label()}</legend>
			<p class="text-muted-foreground -mt-2 text-sm">{m.manuallap_sectors_description()}</p>

			<Form.Field {form} name="s1">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-mono">S1</Form.Label>
						<LapTimeInput {...props} size="sm" bind:value={$formData.s1} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="s2">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-mono">S2</Form.Label>
						<LapTimeInput {...props} size="sm" bind:value={$formData.s2} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="space-y-2">
				<span class="block font-mono text-sm leading-none font-medium">S3</span>
				<output
					class={cn(
						'flex h-10 items-center justify-center rounded-md border border-dashed font-mono text-xl',
						s3Ms !== null && s3Ms <= 0 ? 'text-destructive' : 'text-muted-foreground'
					)}
				>
					{s3Ms === null ? '--:--.---' : s3Ms > 0 ? formatLaptime(s3Ms) : '—'}
				</output>
			</div>
		</fieldset>

		<!-- Buttons -->
		<div class="flex justify-center gap-4">
			<Button type="button" variant="outline" size="lg" class="flex-1" onclick={goBack}>
				<ArrowLeft class="size-5" />
				{m.manuallap_back()}
			</Button>
			<Button type="submit" disabled={$submitting} variant="cta" size="lg" class="flex-1">
				{#if $submitting}
					<Spinner class="size-5" />
				{:else}
					<Save class="size-5" />
				{/if}
				{m.manuallap_submit()}
			</Button>
		</div>
	</form>
</div>

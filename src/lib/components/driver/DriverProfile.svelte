<!-- Card que mostra a foto do driver e o username -->
<!-- Quando o user for o em sessão, pode editar o nome, a bio e a foto -->

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { superForm, fileProxy } from 'sveltekit-superforms';
	import { driverSchema, AVATAR_MIME_TYPES } from '$lib/schemas/driverSchema';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { DriverProfileProps } from '$lib/types/listings';
	import { resizeAvatar } from '$lib/utils/avatar';

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
	import { Turtle, Save, X, UserRoundPen, ImageUp } from '@lucide/svelte';
	import Spinner from '../ui/spinner/spinner.svelte';

	let { driverForm, username, photoUrl, bio, isCurrentUser }: DriverProfileProps = $props();
	let open = $state(false);
	let previewUrl: string | null = $state(null);
	let fileInput: HTMLInputElement | null = $state(null);

	const form = superForm(driverForm, {
		validators: zod4(driverSchema),
		// Keep the saved name and bio in the fields after a save.
		resetForm: false,
		onUpdated: ({ form }) => {
			if (form.message === 'success') {
				toast.success(m.formdriver_submit_success());
				open = false;
			} else if (form.message === 'error') {
				toast.error(m.formdriver_submit_error());
			}
		},
		onError: () => {
			toast.error(m.formdriver_submit_error());
		}
	});
	const { form: formData, enhance, submitting } = form;
	const avatarFile = fileProxy(form, 'avatar');

	function clearPreview() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
	}

	// The picked file is shrunk to a small square before it goes anywhere, then put back
	// into the input, so the form posts the small one (with or without enhance).
	async function onAvatarChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const picked = input.files?.[0];
		clearPreview();
		if (!picked) return;
		if (!(AVATAR_MIME_TYPES as readonly string[]).includes(picked.type)) {
			toast.error(m.formdriver_avatar_error_type());
			input.value = '';
			return;
		}

		let file = picked;
		try {
			file = await resizeAvatar(picked);
		} catch {
			// Can't decode it here: send the original, the server checks type and size.
		}

		const transfer = new DataTransfer();
		transfer.items.add(file);
		avatarFile.set(transfer.files);
		previewUrl = URL.createObjectURL(file);
	}

	// Closing the dialog drops an unsaved picture.
	$effect(() => {
		if (!open) {
			clearPreview();
			avatarFile.set(new DataTransfer().files);
		}
	});

	onDestroy(clearPreview);
</script>

<div class="mt-4 flex flex-col items-center gap-2">
	<Avatar.Root class="size-20 border-0 border-rose-400">
		<Avatar.Image src={photoUrl ?? undefined} alt={username} />
		<Avatar.Fallback class="bg-linear-to-t from-purple-600 to-purple-400">
			<Turtle class="mb-0.5 ml-1 size-12 text-white" strokeWidth={1.5} />
		</Avatar.Fallback>
	</Avatar.Root>

	<div class="flex flex-col items-center gap-1">
		<h2 class="text-2xl font-semibold">{username}</h2>
		<h2 class="text-md font-regular text-muted-foreground italic">
			{bio ? `"${bio}"` : m.driver_no_bio()}
		</h2>
	</div>
</div>
{#if isCurrentUser}
	<div class="mt-3 flex justify-center">
		<Button variant="cta" size="default" onclick={() => (open = true)}>
			<UserRoundPen class="size-5" />
			{m.formdriver_header()}
		</Button>
	</div>
{/if}

<Dialog.Root bind:open>
	<Dialog.Content class="border-muted-foreground/30 dark:bg-muted border-2 bg-white">
		<Dialog.Header>
			<Dialog.Title>{m.formdriver_header()}</Dialog.Title>
			<Dialog.Description>{m.formdriver_header_description()}</Dialog.Description>
			<Separator class="mt-4 mb-2" />
		</Dialog.Header>

		<form
			method="POST"
			action="?/updateProfile"
			enctype="multipart/form-data"
			class="grid items-start gap-5"
			use:enhance
		>
			<!-- Driver avatar: the circle shows the picked picture before it's saved -->
			<Form.Field {form} name="avatar">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.formdriver_avatar_label()}</Form.Label>
						<div class="flex items-center gap-4">
							<Avatar.Root class="size-16 border-0">
								<Avatar.Image src={previewUrl ?? photoUrl ?? undefined} alt={username} />
								<Avatar.Fallback class="bg-linear-to-t from-purple-600 to-purple-400">
									<Turtle class="mb-0.5 ml-1 size-10 text-white" strokeWidth={1.5} />
								</Avatar.Fallback>
							</Avatar.Root>
							<Button
								type="button"
								variant="outline"
								class="flex-1"
								onclick={() => fileInput?.click()}
							>
								<ImageUp class="size-5" />
								{m.formdriver_avatar_choose()}
							</Button>
							<input
								{...props}
								bind:this={fileInput}
								type="file"
								class="sr-only"
								accept={AVATAR_MIME_TYPES.join(',')}
								bind:files={$avatarFile}
								onchange={onAvatarChange}
							/>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Driver name -->
			<Form.Field {form} name="username">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.formdriver_username_label()}</Form.Label>
						<Input
							{...props}
							bind:value={$formData.username}
							placeholder={m.formdriver_username_placeholder()}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Driver bio -->
			<Form.Field {form} name="bio">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.formdriver_bio_label()}</Form.Label>
						<Textarea
							{...props}
							rows={4}
							bind:value={$formData.bio}
							placeholder={m.formdriver_bio_placeholder()}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Buttons -->
			<div class="flex justify-center gap-4">
				<Button
					type="button"
					disabled={$submitting}
					variant="outline"
					size="lg"
					class="flex-1"
					onclick={() => (open = false)}
				>
					<X class="size-5" />
					{m.formdriver_cancel_button()}
				</Button>
				<Button type="submit" disabled={$submitting} variant="cta" size="lg" class="flex-1">
					{#if $submitting}
						<Spinner class="size-5" />
					{:else}
						<Save class="size-5" />
					{/if}
					{m.formdriver_submit_button()}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>

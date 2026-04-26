<!-- Card que mostra a foto do driver e o username -->
<!-- Quando o user for o em sessão, pode editar o nome e foto (duas ações diferentes) -->

<script lang="ts">
	// types
	import { type Infer, superForm, type SuperValidated, superValidate } from 'sveltekit-superforms';
	import { driverSchema, type DriverSchema } from '$lib/schemas/driverSchema';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { m } from '$lib/paraglide/messages.js';
	import { toast } from 'svelte-sonner';

	// ui
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Pencil, Turtle, Save, X, UserRoundPen } from '@lucide/svelte';


	// todo: mudar este props para que a info do driver fique num type, e incluir o form no props
	interface Props {
		username: string;
		photoUrl: string;
		bio?: string;
		isCurrentUser: boolean;
	}

	let { username, photoUrl, bio, isCurrentUser }: Props = $props();

	let isEditing = $state(false);

	const handleEditProfile = () => {
		// Lógica para editar o perfil do driver
		isEditing = true;
		console.log('Editar perfil do driver');
	};
</script>

<div class="mt-4 flex flex-col items-center gap-2">
	{#if !isEditing}
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
	{:else if isCurrentUser}
		editing
	{/if}
</div>

{#if isEditing}
	<div class="mt-3 flex justify-center gap-4">
		<Button variant="outline" size="lg" class="" onclick={() => (isEditing = false)}>
			<!-- <span>Salvar</span> -->
			<X class="size-5" />
			Cancelar
		</Button>
		<Button
			variant="cta"
			size="lg"
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
			Salvar alterações
		</Button>
	</div>
{:else if isCurrentUser}
	<div class="mt-3 flex justify-center">
		<Button variant="cta" size="default" class="" onclick={handleEditProfile}>
			<!-- <span>Editar</span> -->
			<!-- <Pencil class="size-4" /> -->
			<UserRoundPen class="size-5" />
			Editar perfil
		</Button>
	</div>
{/if}

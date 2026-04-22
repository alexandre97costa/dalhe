<!-- Card que mostra a foto do driver e o username -->
<!-- Quando o user for o em sessão, pode editar o nome e foto (duas ações diferentes) -->

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Pencil, Turtle } from '@lucide/svelte';

	interface Props {
		username: string;
		photoUrl: string;
		isCurrentUser: boolean;
	}

	let { username, photoUrl, isCurrentUser }: Props = $props();

	const handleEditProfile = () => {
		// Lógica para editar o perfil do driver
		console.log('Editar perfil do driver');
	};
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
			"To finish first, first you have to finish"
		</h2>
	</div>
</div>

{#if isCurrentUser}
	<div class="flex justify-center mt-3">
		<Button variant="outline" size="default" class="" onclick={handleEditProfile}>
			<!-- <span>Editar</span> -->
			Editar perfil
			<Pencil class="size-4" />
		</Button>
	</div>
{/if}

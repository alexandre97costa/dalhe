<!-- Card que mostra a foto do driver e o username -->
<!-- Quando o user for o em sessão, pode editar o nome e foto (duas ações diferentes) -->

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
    import {Pencil } from '@lucide/svelte';


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


<div class="flex gap-4">
    <Avatar.Root class="size-20">
        <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
        <Avatar.Fallback>CN</Avatar.Fallback>
    </Avatar.Root>

    <div class="flex-1 flex flex-col gap-2">

        <div class="flex items-center justify-between gap-4">

            <h2 class="text-xl font-semibold">{username}</h2>
            {#if isCurrentUser}
            <Button variant="outline" size="sm" onclick={handleEditProfile}>
                <span>Editar</span> 
                <Pencil class="size-3" />
            </Button>
            {/if}
        </div>
    </div>
</div>


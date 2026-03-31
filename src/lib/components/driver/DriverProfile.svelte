<!-- Card que mostra a foto do driver e o username -->
<!-- Quando o user for o em sessão, pode editar o nome e foto (duas ações diferentes) -->

<script lang="ts">

    import { Button } from '$lib/components/ui/button/index';
    import * as Card from '$lib/components/ui/card/index.js';

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


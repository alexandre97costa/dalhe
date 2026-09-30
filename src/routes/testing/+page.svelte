<script lang="ts">

import HeroBanner from "$lib/components/HeroBanner.svelte";
import HeroBanner2 from "$lib/components/HeroBanner2.svelte";

</script>

<div class="flex h-[80dvh] w-full flex-col items-center justify-center gap-4">
    <h1 class="text-2xl font-semibold">Página de teste</h1>
    <p class="text-md text-muted-foreground">
        Esta página é usada para testar componentes e funcionalidades em desenvolvimento.
    </p>
    <HeroBanner />
    <HeroBanner2 />

</div>
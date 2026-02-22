<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
    import * as Avatar from '$lib/components/ui/avatar/index.js';
    import { type Icon as IconType, MapPin, Timer, Car } from '@lucide/svelte';
</script>

<div class="flex items-center gap-4 px-3 py-2 rounded-md border">
	<Avatar.Root class="  border-purple-500 bg-purple-500 dark:border-purple-600 size-12">
		<Avatar.Image
			src="https://avatars.githubusercontent.com/u/38655930?v=4"
			alt="alexandre"
		/>
		<Avatar.Fallback>CN</Avatar.Fallback>
	</Avatar.Root>

    <div class="flex flex-col flex-1">
        <p class="lh-1 text-muted-foreground text-xs">3 mins ago</p>
        <p class="text-md ">Alexandre Costa</p>
        <p class="lh-1 text-muted-foreground text-xs">
            <Car class="size-4 -mt-1 mr-1 inline" strokeWidth=1.5 />
            Audi R8 MLS Evo II
        </p>
    </div>
    <div class="flex flex-col justify-end text-right">
        <p class="lh-1 text-muted-foreground text-xs">Spa-Francorchamps</p>
        <h1 class="lh-1 font-mono text-lg font-bold">01:23.456</h1>
        <p class="lh-1 font-mono text-red-400 text-xs">+0.210s</p>
    </div>

</div>

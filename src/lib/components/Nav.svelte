<script>
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { cn } from '$lib/utils.js';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import IconClockPlus from '@lucide/svelte/icons/clock-plus';
	import IconPlus from '@lucide/svelte/icons/plus';

	import NavigationMenuItem from './ui/navigation-menu/navigation-menu-item.svelte';

	import { m } from '$lib/paraglide/messages.js';

	const links = [
		{
			title: m.nav_home(),
			href: '/demo/aura-mockup',
			description:
				'A modal dialog that interrupts the user with important content and expects a response.'
		},
		{
			title: m.nav_leaders(),
			href: '/leaders',
			description: 'For sighted users to preview content available behind a link.'
		},
		{
			title: m.nav_tournaments(),
			href: '/tournaments',
			description:
				'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.'
		},
		{
			title: m.nav_profile(),
			href: '/profile',
			description:
				'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.'
		}
	];
</script>

<NavigationMenu.Root
	viewport={false}
	class="bg-popover/20 backdrop-blur-sm dark:border-input max-w-full border-t-1 px-4 py-4 shadow-xl "
>
	<NavigationMenu.List class="grid grid-cols-10 gap-3 min-w-[100vw] md:min-w-full">
		{#each links as link, i (i)}
			{#if i == 0 || i == 1}
				<NavigationMenu.Item class="flex justify-center col-span-2">
					<NavigationMenu.Link href={link.href}>
						{link.title}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			{/if}
		{/each}

		<NavigationMenuItem class="relative h-4  col-span-2 flex justify-center">
			<NavigationMenu.Link asChild>
				{#snippet child()}
					<Button
						href="/new"
						variant=""
						class="
								absolute 
								bottom-1
								aspect-square
								scale-125
								mx-2.5

								backdrop-blur-sm
								shadow-lg
								shadow-purple-500/20 
								dark:shadow-purple-400/20 

								rounded-4xl
								border-1 
								border-purple-300
								dark:border-purple-400
								bg-purple-400/20
								py-5
								text-purple-600 
								dark:text-purple-400  
							"
					>
						<IconPlus size="48" />
					</Button>
				{/snippet}
			</NavigationMenu.Link>
		</NavigationMenuItem>

		{#each links as link, i (i)}
			{#if i == 2 || i == 3}
				<NavigationMenu.Item class="flex justify-center col-span-2">
					<NavigationMenu.Link href={link.href}>
						{link.title}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			{/if}
		{/each}
	</NavigationMenu.List>
</NavigationMenu.Root>

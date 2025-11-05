<script lang="ts">
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import NavigationMenuItem from './ui/navigation-menu/navigation-menu-item.svelte';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { cn } from '$lib/utils.js';
	import { type Icon as IconType, Home, Trophy, Flag, UserRound, Plus } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { open = $bindable(false) } = $props();

	type MenuItem = {
		title: string;
		href: string;
		description: string;
		icon: typeof IconType;
		order: number;
	};

	const menuItems: MenuItem[] = [
		{
			title: m.nav_home(),
			href: '/demo/aura-mockup',
			description:
				'A modal dialog that interrupts the user with important content and expects a response.',
			icon: Home,
			order: 1
		},
		{
			title: m.nav_leaders(),
			href: '/demo/supa',
			description: 'For sighted users to preview content available behind a link.',
			icon: Trophy,
			order: 2
		},
		{
			title: m.nav_tournaments(),
			href: '/tournaments',
			description:
				'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
			icon: Flag,
			order: 4
		},
		{
			title: m.nav_profile(),
			href: '/profile',
			description:
				'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
			icon: UserRound,
			order: 5
		}
	];
</script>

{#snippet menuItem(item: MenuItem, i: number)}
	{@const Icon = item.icon}
	<NavigationMenu.Item
		class={cn('col-span-2 flex justify-center', i < 2 ? 'order-first' : 'order-last')}
	>
		<NavigationMenu.Link href={item.href} class="flex flex-col items-center gap-2">
			<Icon strokeWidth=2.5 />
			<span class="text-sm font-medium">
				{item.title}
			</span>
		</NavigationMenu.Link>
	</NavigationMenu.Item>
{/snippet}

<NavigationMenu.Root
	viewport={false}
	class="bg-popover/20 dark:border-input max-w-full border-t px-4 py-2 shadow-xl backdrop-blur-sm "
>
	<NavigationMenu.List class="grid min-w-screen grid-cols-10 gap-3 md:min-w-full">
		{#each menuItems as item, i}
			{@render menuItem(item, i)}
		{/each}

		<NavigationMenuItem class="relative col-span-2 flex h-3 justify-center ">
			<NavigationMenu.Link asChild>
				{#snippet child()}
					<Button
						onclick={() => (open = !open)}
						variant=""
						class="
								absolute
								bottom-0.5 
								aspect-square
								cursor-pointer
								h-13 w-13

								rounded-4xl
								border-[1.5px]
								border-purple-300 
								bg-purple-400/20

								text-purple-600 
								shadow-lg
								shadow-purple-500/20
								backdrop-blur-lg
								dark:border-purple-400
								dark:text-purple-400 
								dark:shadow-purple-400/20  
							"
					>
					<div class="scale-[180%]">

						<Plus  strokeWidth=2 />
					</div>
						<span class="sr-only">{m.nav_add}</span>
					</Button>
				{/snippet}
			</NavigationMenu.Link>
		</NavigationMenuItem>
	</NavigationMenu.List>
</NavigationMenu.Root>

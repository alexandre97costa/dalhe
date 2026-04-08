<script lang="ts">
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils.js';
	import {
		type Icon as IconType,
		House,
		Trophy,
		UserRound,
		Plus,
		ChessQueen
	} from '@lucide/svelte';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { Button } from '$lib/components/ui/button/index';
	import NavigationMenuItem from './ui/navigation-menu/navigation-menu-item.svelte';

	let { open = $bindable(false), driverId, isNavigating } = $props();
	let titleValue = $derived($title);

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
			href: '/home',
			description:
				'The home page serves as the central hub for users to access various features and information related to the application.',
			icon: House,
			order: 1
		},
		{
			title: m.nav_leaders(),
			href: '/leaders',
			description: 'leaderboard page for each track',
			icon: ChessQueen,
			order: 2
		},
		{
			title: m.nav_tournaments(),
			href: '/tournaments',
			description: 'Tournament information and results',
			icon: Trophy,
			order: 4
		},
		{
			title: m.nav_profile(),
			href: `/driver/${driverId}`,
			description: 'Manage your profile and settings',
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
		<NavigationMenu.Link
			href={item.href}
			class={cn(
				'flex flex-col items-center gap-2 pt-3',
				titleValue == item.title ? 'bg-white dark:bg-zinc-800' : ''
			)}
		>
			<Icon
				strokeWidth="2"
				class={titleValue == item.title ? 'text-zinc-800 dark:text-zinc-50' : 'text-zinc-400'}
			/>
			<span
				class={cn(
					'text-sm font-light',
					titleValue == item.title ? 'text-foreground' : 'text-muted-foreground'
				)}
			>
				{item.title}
			</span>
		</NavigationMenu.Link>
	</NavigationMenu.Item>
{/snippet}

<NavigationMenu.Root
	viewport={false}
	class="dark:border-input max-w-full border-t bg-zinc-100 px-4 py-2 shadow-xl backdrop-blur-sm dark:bg-zinc-900 "
>
	<NavigationMenu.List class="grid min-w-screen grid-cols-10 gap-3 md:min-w-full">
		{#each menuItems as item, i}
			{@render menuItem(item, i)}
		{/each}

		<NavigationMenuItem class="relative col-span-2 flex h-3 justify-center ">
			<NavigationMenu.Link>
				{#snippet child()}
					<Button
						onclick={() => (open = !open)}
						class="
								absolute
								bottom-0.5 
								aspect-square
								h-13
								w-13 cursor-pointer

								rounded-4xl
								border-[1.5px]
								border-purple-300 
								bg-zinc-50
								text-purple-600

								backdrop-blur-lg
								hover:bg-white
								dark:border-purple-400
								dark:bg-zinc-900 
								dark:text-purple-400  
								dark:shadow-purple-400/20
								dark:hover:bg-zinc-800

							"
					>
						<!-- {#if isNavigating}
							<div
								class="scale-[180%] size-4 animate-spin rounded-full border-1 border-t-purple-500"
							></div>
						{:else} -->
							<div class="scale-[180%]">
								<Plus strokeWidth="2" />
							</div>
						<!-- {/if} -->
						<span class="sr-only">{m.nav_add}</span>
					</Button>
				{/snippet}
			</NavigationMenu.Link>
		</NavigationMenuItem>
	</NavigationMenu.List>
</NavigationMenu.Root>

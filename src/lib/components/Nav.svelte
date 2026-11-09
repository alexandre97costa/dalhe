<script lang="ts">
	import { title } from '$lib/store.js';
	import { m } from '$lib/paraglide/messages.js';
	import { cn } from '$lib/utils.js';
	import { type LucideIcon, House, Trophy, UserRound, ChessQueen } from '@lucide/svelte';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';

	let { driverId, isNavigating } = $props();
	let titleValue = $derived($title);

	type MenuItem = {
		title: string;
		href: string;
		description: string;
		icon: LucideIcon;
		order: number;
		disabled?: boolean;
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
			order: 3,
			// Shown but not clickable until the page exists (backlog).
			disabled: true
		},
		{
			title: m.nav_profile(),
			href: `/driver/${driverId}`,
			description: 'Manage your profile and settings',
			icon: UserRound,
			order: 4
		}
	];
</script>

{#snippet menuItem(item: MenuItem, i: number)}
	{@const Icon = item.icon}
	<NavigationMenu.Item class={cn(`flex justify-center order-${i}`)}>
		<NavigationMenu.Link
			href={item.disabled ? undefined : item.href}
			aria-disabled={item.disabled || undefined}
			tabindex={item.disabled ? -1 : undefined}
			class={cn(
				'flex size-18 flex-col items-center gap-2 pt-2',
				item.disabled && 'pointer-events-none opacity-50'
			)}
		>
			<Icon
				strokeWidth={titleValue == item.title ? '1.5' : '1'}
				class={cn(
					'size-6',
					titleValue == item.title ? 'text-purple-700 dark:text-purple-500' : 'text-foreground/70'
				)}
			/>
			<!-- /* class={cn('size-6', titleValue == item.title ? 'text-zinc-800 dark:text-zinc-50' : 'text-zinc-400')} */ -->
			<span
				class={cn(
					'text-sm ',
					titleValue == item.title
						? 'font-normal text-purple-800 dark:text-purple-400'
						: 'text-foreground font-light'
				)}
			>
				{item.title}
			</span>
		</NavigationMenu.Link>
	</NavigationMenu.Item>
{/snippet}

<NavigationMenu.Root
	viewport={false}
	class="dark:border-input max-w-full border-t  bg-white px-4 py-2 shadow-xl dark:bg-zinc-900 "
>
	<NavigationMenu.List class="grid min-w-screen grid-cols-4 gap-3 md:min-w-full">
		{#each menuItems as item, i}
			{@render menuItem(item, i)}
		{/each}
	</NavigationMenu.List>
</NavigationMenu.Root>

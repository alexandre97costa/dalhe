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

	import NavigationMenuItem from './ui/navigation-menu/navigation-menu-item.svelte';

	import { m } from '$lib/paraglide/messages.js';

	const links = [
		{
			title: m.nav_home(),
			href: '/times',
			description:
				'A modal dialog that interrupts the user with important content and expects a response.'
		},
		{
			title: 'Líderes',
			href: '/tracks',
			description: 'For sighted users to preview content available behind a link.'
		},
		{
			title: 'Torneios',
			href: '/drivers',
			description:
				'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.'
		},
		{
			title: 'Perfil',
			href: '/drivers',
			description:
				'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.'
		}
	];

	const tournaments = [
		{
			title: 'Criar torneio',
			href: '/tournaments/new',
			description: 'Para criar e ser anfitrião de um torneio.'
		},
		{
			title: 'Participar em torneio',
			href: '/tournaments/active',
			description: 'Para participar num torneio que esteja a decorrer.'
		},
		{
			title: 'Ver torneios',
			href: '/tournaments',
			description: 'Ver todos os torneios, acabados e a decorrer.'
		}
	];
</script>

{#snippet ListItem({ title, content, href, class: className, ...restProps })}
	<li>
		<NavigationMenu.Link>
			{#snippet child()}
				<a
					{href}
					class={cn(
						'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none',
						className
					)}
					{...restProps}
				>
					<div class="text-sm leading-none font-medium">{link.title}</div>
					<p class="text-muted-foreground line-clamp-2 text-sm leading-snug">
						{content}
					</p>
				</a>
			{/snippet}
		</NavigationMenu.Link>
	</li>
{/snippet}

<NavigationMenu.Root
	viewport={false}
	class="bg-popover dark:border-input w-full rounded-tl-2xl rounded-tr-2xl border-x-1 border-t-1 px-4 py-4 shadow-xl "
>
	<NavigationMenu.List class="gap-3">
		<!-- Inicio e Líderes -->
		{#each links as link, i (i)}
			{#if i >= 0 && i <= 1}
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href={link.href} class={navigationMenuTriggerStyle()}>{link.title}</a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			{/if}
		{/each}

		<!-- CTA principal -->
		<NavigationMenuItem>
			<NavigationMenu.Link>
				{#snippet child()}
					<Button
						href="times/new"
						variant="outline"
						class="
								border-purple-500 
								text-purple-500 
								hover:bg-purple-500 
								hover:text-white 
								
								dark:border-purple-500
								dark:bg-neutral-900 
								dark:text-purple-400 
								dark:hover:bg-purple-600 
								dark:hover:text-white 
							"
					>
						<IconClockPlus />
					</Button>
				{/snippet}
			</NavigationMenu.Link>
		</NavigationMenuItem>

		<!-- Torneios e Perfil -->
		{#each links as link, i (i)}
			{#if i >= 2 && i <= 3}
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href={link.href} class={navigationMenuTriggerStyle()}>{link.title}</a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			{/if}
		{/each}
	</NavigationMenu.List>
</NavigationMenu.Root>

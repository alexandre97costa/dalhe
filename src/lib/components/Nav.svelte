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

	const links = [
		{
			title: 'Início',
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
					<div class="text-sm leading-none font-medium">{title}</div>
					<p class="text-muted-foreground line-clamp-2 text-sm leading-snug">
						{content}
					</p>
				</a>
			{/snippet}
		</NavigationMenu.Link>
	</li>
{/snippet}

<!-- <div class="flex items-center justify-between "> -->
	<NavigationMenu.Root viewport={false} class="bg-popover dark:border-input w-full px-4 py-4 rounded-tl-2xl rounded-tr-2xl border-t-1 border-x-1 shadow-xl ">
		<NavigationMenu.List class="gap-3">
			{#each links as link, i (i)}
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href={link.href} class={navigationMenuTriggerStyle()}>{link.title}</a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			{/each}
<!-- 
			<NavigationMenu.Item>
				<NavigationMenu.Trigger>Torneios</NavigationMenu.Trigger>
				<NavigationMenu.Content>
					<ul class="grid gap-2 p-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
						<li class="row-span-3">
							<NavigationMenu.Link
								class="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
							>
								{#snippet child({ props })}
									<div {...props}>
										<div class="flex items-center gap-2">
											<div class="mt-2 mb-2 text-lg font-medium">Torneios</div>
											<Badge variant="secondary" class="bg-amber-500 text-white dark:bg-amber-600">
												Novo
											</Badge>
										</div>
										<p class="text-muted-foreground text-sm leading-tight">
											Competição entre vários condutores, em várias pistas, com lista de tempos
											isolada.
										</p>
									</div>
								{/snippet}
							</NavigationMenu.Link>
						</li>
						{#each tournaments as tournament, i (i)}
							{@render ListItem({
								href: tournament.href,
								title: tournament.title,
								content: tournament.description
							})}
						{/each}
					</ul>
				</NavigationMenu.Content>
			</NavigationMenu.Item> -->

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
							Novo tempo
							<IconClockPlus />
						</Button>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenuItem>
		</NavigationMenu.List>
	</NavigationMenu.Root>
	
<!-- </div> -->

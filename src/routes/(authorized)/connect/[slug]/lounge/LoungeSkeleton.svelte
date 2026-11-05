<script lang="ts">
	// Placeholder for the three lounge cards while the session data streams in: the same cards,
	// spacing and heights as SessionCard (collapsed), LiveLapCard (live) and SessionLaps (table
	// view, the default), so nothing jumps when the data arrives.
	import { m } from '$lib/paraglide/messages.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	// animate-none replaces the component's animate-pulse, which ignores prefers-reduced-motion.
	const pulse = 'animate-none motion-safe:animate-pulse';
	const SECTORS = [1, 2, 3];
	const ROWS = [1, 2, 3, 4, 5];
</script>

<div class="contents" role="status" aria-busy="true">
	<span class="sr-only">{m.lounge_loading()}</span>

	<!-- SessionCard, collapsed -->
	<Card.Root class="gap-2 py-2 shadow-none" aria-hidden="true">
		<Card.Header class="flex items-center justify-between gap-2 pr-2 pl-4">
			<Skeleton class="{pulse} h-4 w-2/3" />
			<Skeleton class="{pulse} size-8 shrink-0 rounded-lg" />
		</Card.Header>
	</Card.Root>

	<!-- LiveLapCard, live -->
	<Card.Root class="gap-1 py-4" aria-hidden="true">
		<Card.Header class="px-4">
			<Skeleton class="{pulse} my-1 h-4 w-24" />
			<!-- The lap clock: same font clamp as the card, so the height follows the screen width. -->
			<div class="mb-1.5 flex h-[1.5em] items-center text-[clamp(1rem,8.5vw,2.25rem)]">
				<Skeleton class="{pulse} h-[0.95em] w-48" />
			</div>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4 px-4">
			<Skeleton class="{pulse} h-3 w-full rounded-full" />
			<div class="grid grid-cols-3 gap-3">
				{#each SECTORS as sector (sector)}
					<div class="flex min-w-0 flex-col gap-1">
						<Skeleton class="{pulse} my-0.5 h-3 w-8" />
						<Skeleton class="{pulse} my-1 h-4 w-14" />
						<Skeleton class="{pulse} h-2 rounded-full" />
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- SessionLaps, table view -->
	<Card.Root class="gap-2 py-4" aria-hidden="true">
		<Card.Header class="flex justify-between px-4">
			<Skeleton class="{pulse} h-4 w-28" />
		</Card.Header>
		<Card.Content class="px-4">
			<div class="flex flex-col gap-2 pt-2 pb-6 sm:flex-row sm:items-center">
				<Skeleton class="{pulse} h-[34px] w-full rounded-full sm:flex-1" />
				<Skeleton class="{pulse} h-[30px] w-full rounded-full sm:flex-1" />
			</div>
			<div class="flex flex-col">
				<Skeleton class="{pulse} my-1 h-5 w-full" />
				<Skeleton class="{pulse} mt-5 mb-2 h-4 w-full" />
				{#each ROWS as row (row)}
					<div class="flex h-[33px] items-center justify-between gap-3">
						<Skeleton class="{pulse} h-4 w-5" />
						<Skeleton class="{pulse} h-4 flex-1" />
						<Skeleton class="{pulse} h-4 w-12" />
						<Skeleton class="{pulse} h-4 w-12" />
						<Skeleton class="{pulse} h-4 w-12" />
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>

<script>
	import { m } from '$lib/paraglide/messages.js';
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';

	let open = $state(false);
	const isDesktop = new MediaQuery('(min-width: 768px)');

	const id = $props.id();
</script>

{#snippet form()}
	<form class="grid items-start gap-4">
		<div class="grid gap-2">
			<Label for="email-{id}">Email</Label>
			<Input type="email" id="email-{id}" value="shadcn@example.com" />
		</div>
		<div class="grid gap-2">
			<Label for="username-{id}">Username</Label>
			<Input id="username-{id}" value="@shadcn" />
		</div>
		<div class="flex w-full flex-col gap-4 px-4">
			<Label for="input-laptime">Tempo</Label>

			<InputOTP.Root
				maxlength={7}
				pattern={REGEXP_ONLY_DIGITS}
				on:change={(e) => console.log(e)}
				id="input-laptime"
			>
				{#snippet children({ cells })}
					<InputOTP.Group>
						{#each cells.slice(0, 2) as cell}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
					<InputOTP.Separator>:</InputOTP.Separator>
					<InputOTP.Group>
						{#each cells.slice(2, 4) as cell}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
					<InputOTP.Separator>.</InputOTP.Separator>
					<InputOTP.Group>
						{#each cells.slice(4, 7) as cell}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
				{/snippet}
			</InputOTP.Root>
		</div>
		<Button type="submit">{m.nav_add_save()}</Button>
	</form>
{/snippet}

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Trigger asChild>
			<Button variant="outline">
				{m.nav_add()}
			</Button>
		</Dialog.Trigger>
		<Dialog.Content class="">
			<Dialog.Header>
				<Dialog.Title>{m.nav_add()}</Dialog.Title>
				<!-- <Dialog.Description> -->
			</Dialog.Header>
			{@render form()}
			<Dialog.Footer>
				<Dialog.Close>{m.nav_add_cancel()}</Dialog.Close>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger asChild>
			<Button variant="outline">
				{m.nav_add()}
			</Button>
		</Drawer.Trigger>
		<Drawer.Content class="">
			<Drawer.Header class="text-center">
				<Drawer.Title>{m.nav_add()}</Drawer.Title>
				<!-- <Drawer.Description> -->
			</Drawer.Header>
			{@render form()}
			<Drawer.Footer>
				<Drawer.Close>{m.nav_add_cancel()}</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}

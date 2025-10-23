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

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
			{m.nav_add()}
		</Dialog.Trigger>
		<Dialog.Content class="">
			<Dialog.Header>
				<Dialog.Title>{m.nav_add()}</Dialog.Title>
				<!-- <Dialog.Description>
					Make changes to your profile here. Click save when you're done.
				</Dialog.Description> -->
			</Dialog.Header>
			<form class="grid items-start gap-4">
				<div class="grid gap-2">
					<Label for="email-{id}">Email</Label>
					<Input type="email" id="email-{id}" value="shadcn@example.com" />
				</div>
				<div class="grid gap-2">
					<Label for="username-{id}">Username</Label>
					<Input id="username-{id}" value="@shadcn" />
				</div>
				<Button type="submit">Save changes</Button>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger asChild>
			<Button variant="outline" class={buttonVariants({ variant: 'outline' })}>
				{m.nav_add()}
			</Button>
		</Drawer.Trigger>
		<Drawer.Content class="">
			<Drawer.Header class="text-center">
				<Drawer.Title>{m.nav_add()}</Drawer.Title>
				<!-- <Drawer.Description>
				{m.nav_add()}
			</Drawer.Description> -->
			</Drawer.Header>
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
			<Drawer.Footer>
				<Button>Submit</Button>
				<Drawer.Close>Cancel</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}

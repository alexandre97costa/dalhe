<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import type { Session } from '@supabase/supabase-js';
	import Button from './ui/button/button.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	import UserIcon from '@lucide/svelte/icons/user';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import { m } from '$lib/paraglide/messages.js';
	import { toast } from 'svelte-sonner';
	import { redirect } from '@sveltejs/kit';

	let sessionData = $state<Session | null>(null);
	let testing = $state(false);
	let open = $state(false); // for dropdown menu

	onMount(async () => {
		const {
			data: { session },
			error
		} = await supabase.auth.getSession();
		if (error) {
			toast.error('Error getting user session');
			console.error('Error getting user session:', error.message);
		}
		sessionData = session;
	});
</script>

{#if !sessionData && !testing}
	<!-- TODO: mudar o que este botao faz quando tivermos a user session pronta -->
	<!-- <Button variant="cta" size="sm" onclick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}> -->
	<Button
		variant="cta"
		size="sm"
		onclick={() => {
			// testing = true;
			redirect(303, '/login');
		}}
	>
		{m.login_button()}
	</Button>
{:else}
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline" class="dark:bg-background  cursor-pointer ">
					<!-- <span>{sessionData?.user.email ?? ''}</span> -->
					<Avatar.Root class=" scale-125 border-2 border-purple-500 dark:border-purple-600">
						<Avatar.Image
							src="https://avatars.githubusercontent.com/u/38655930?v=4"
							alt="@shadcn"
						/>
						<Avatar.Fallback>CN</Avatar.Fallback>
					</Avatar.Root>
					<ChevronDownIcon class={'ml-2 h-4 w-4 duration-200 ' + (open ? '-scale-100' : '')} />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Content class="w-56" align="start">
			<DropdownMenu.Label>My Account</DropdownMenu.Label>
			<DropdownMenu.Item>Profile</DropdownMenu.Item>
			<DropdownMenu.Item>Settings</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Label>Preferences</DropdownMenu.Label>
			<DropdownMenu.Item>Theme</DropdownMenu.Item>
			<DropdownMenu.Item>Language</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item>Log out</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}

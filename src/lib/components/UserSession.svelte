<script lang="ts">
	import { redirect } from '@sveltejs/kit';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, setLocale } from '$lib/paraglide/runtime.js';
	import { resetMode, setMode } from 'mode-watcher';

	import Button from './ui/button/button.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { toast } from 'svelte-sonner';

	import { Moon, Sun, Monitor, ChevronDownIcon } from '@lucide/svelte';

	let { user = $bindable(null), open = $bindable(false) } = $props();
	let theme: 'light' | 'dark' | 'system' = $state('system');
	let language = $state(getLocale());
	let testing = $state(true);

	$effect(() => {
		console.log('User session data changed:', user);
	});
</script>

<!-- <Button variant="cta" size="sm" onclick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}> -->

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" class="dark:bg-background cursor-pointer gap-4 ">
				<span>{testing ? 'alexandre' : user?.email ?? ''}</span>
				<Avatar.Root class=" scale-150 border-2 border-purple-500 dark:border-purple-600 bg-purple-500">
					<Avatar.Image src="https://avatars.githubusercontent.com/u/38655930?v=4"  alt={user?.email ?? 'user'} />
					<Avatar.Fallback>CN</Avatar.Fallback>
				</Avatar.Root>
				<ChevronDownIcon class={'size-4 duration-200 ' + (open ? '-scale-100' : '')} />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content class="w-56" align="start">
		<DropdownMenu.Group>
			<DropdownMenu.Label>{m.user_dropdown_account()}</DropdownMenu.Label>
			<DropdownMenu.Item>{m.user_dropdown_profile()}</DropdownMenu.Item>
			<DropdownMenu.Item>{m.user_dropdown_settings()}</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.RadioGroup bind:value={theme}>
				<DropdownMenu.GroupHeading class="text-sm font-normal">{m.user_dropdown_theme()}</DropdownMenu.GroupHeading>
				<DropdownMenu.RadioItem value="light" onclick={() => setMode('light')}>
					<Sun />
					{m.user_dropdown_theme_light()}
				</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="dark" onclick={() => setMode('dark')}>
					<Moon />
					{m.user_dropdown_theme_dark()}
				</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="system" onclick={() => resetMode()}>
					<Monitor />
					{m.user_dropdown_theme_system()}
				</DropdownMenu.RadioItem>
			</DropdownMenu.RadioGroup>
			<DropdownMenu.Separator />
			<DropdownMenu.RadioGroup bind:value={language}>
				<DropdownMenu.GroupHeading class="text-sm font-normal">{m.user_dropdown_language()}</DropdownMenu.GroupHeading>
				<DropdownMenu.RadioItem value="pt" onclick={() => setLocale('pt')}>
					<img
						src="https://flagsapi.com/PT/flat/64.png"
						alt="Portuguese Flag"
						class="inline size-5"
					/>
					{m.user_dropdown_language_pt()}					
				</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="en" onclick={() => setLocale('en')}>
					<img
						src="https://flagsapi.com/GB/flat/64.png"
						alt="Great Britain Flag"
						class="inline size-5"
					/>
					{m.user_dropdown_language_en()}
				</DropdownMenu.RadioItem>
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Item class="text-destructive">{m.user_dropdown_logout()}</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

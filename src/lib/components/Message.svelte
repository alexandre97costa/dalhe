<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type {
		MessagePart,
		MessageMarkupOptions,
		MessageMarkupAttributes
	} from '$lib/paraglide/runtime.js';

	// Any compiled Paraglide message: m.foo has .parts() next to the plain-text call.
	type MarkupMessage = { parts: (inputs: never) => MessagePart[] };

	export type MarkupRenderer = Snippet<
		[
			{
				// Undefined for a standalone tag ({#icon/}).
				children?: Snippet;
				options: MessageMarkupOptions;
				attributes: MessageMarkupAttributes;
			}
		]
	>;

	type MarkupNode =
		| { type: 'text'; value: string }
		| {
				type: 'tag';
				name: string;
				standalone: boolean;
				options: MessageMarkupOptions;
				attributes: MessageMarkupAttributes;
				children: MarkupNode[];
		  };

	// parts() is a flat list of text and start/end markers; nest it into a tree to render.
	function toTree(parts: MessagePart[]): MarkupNode[] {
		const root: MarkupNode[] = [];
		const stack: Extract<MarkupNode, { type: 'tag' }>[] = [];
		const current = () => stack.at(-1)?.children ?? root;

		for (const part of parts) {
			if (part.type === 'text') {
				current().push({ type: 'text', value: part.value });
			} else if (part.type === 'markup-end') {
				// Close up to the matching tag; a stray end tag is ignored.
				const index = stack.findLastIndex((tag) => tag.name === part.name);
				if (index !== -1) stack.length = index;
			} else {
				const tag = {
					type: 'tag' as const,
					name: part.name,
					standalone: part.type === 'markup-standalone',
					options: part.options,
					attributes: part.attributes,
					children: []
				};
				current().push(tag);
				if (!tag.standalone) stack.push(tag);
			}
		}
		return root;
	}
</script>

<script lang="ts" generics="M extends MarkupMessage">
	// Renders a Paraglide message with its markup ({#b}…{/b}) as real elements. Text, inputs
	// included, is only ever rendered as text, so user content (a username) can't inject HTML.
	//
	// Built-in tags: b (bold), i (italic). Pass `markup` to render other tags, or to override a
	// built-in one for a single call site. An unknown wrapping tag renders just its children; an
	// unknown standalone tag renders nothing (same as Paraglide's own adapters).
	//
	//   <Message message={m.home_rig_status_driving} inputs={{ driverName }} />

	let {
		message,
		inputs,
		markup
	}: {
		message: M;
		inputs: Parameters<M['parts']>[0];
		markup?: Record<string, MarkupRenderer>;
	} = $props();

	let nodes = $derived(toTree(message.parts(inputs)));
</script>

{#snippet render(nodes: MarkupNode[])}
	{#each nodes as node, i (i)}
		{#if node.type === 'text'}
			{node.value}
		{:else}
			{#snippet children()}
				{@render render(node.children)}
			{/snippet}
			{@const custom = markup?.[node.name]}
			{#if custom}
				{@render custom({
					children: node.standalone ? undefined : children,
					options: node.options,
					attributes: node.attributes
				})}
			{:else if node.name === 'b'}
				<strong class="font-semibold">{@render children()}</strong>
			{:else if node.name === 'i'}
				<em>{@render children()}</em>
			{:else if !node.standalone}
				{@render children()}
			{/if}
		{/if}
	{/each}
{/snippet}

{@render render(nodes)}

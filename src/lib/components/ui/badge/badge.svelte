<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80 border-transparent",
				secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80 border-transparent",
				destructive: "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
				outline: "border-border text-foreground [a]:hover:bg-accent [a]:hover:text-accent-foreground",
				outline_purple:	"border-purple-500 bg-transparent text-purple-400 [a&]:hover:bg-purple-500/10 [a&]:hover:text-purple-500",
				outline_teal:	"border-teal-500 bg-transparent text-teal-400 [a&]:hover:bg-teal-500/10 [a&]:hover:text-teal-500",
				purple: "border-purple-500 bg-purple-500 text-white [a&]:hover:bg-purple-500/90",
				ghost: "bg-white/25 border-white/20 hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-5 gap-1 rounded-4xl px-2 py-0.5 text-xs",
				sm: "h-4 gap-1 rounded-full px-1.5 text-[0.625rem]",
				lg: "h-10 gap-2 rounded-full px-3 py-1 text-md font-normal",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		size = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
		size?: VariantProps<typeof badgeVariants>["size"];
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant, size }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/ui';

	type Props = {
		title: string;
		description?: string;
		class?: string;
		children: Snippet;
	};

	let { title, description, class: className, children }: Props = $props();
</script>

<fieldset class={cn('min-w-0', className)}>
	<legend class="mb-5 w-full">
		<span class="flex items-center gap-3">
			<span aria-hidden="true" class="size-1.5 shrink-0 rotate-45 bg-gold-400"></span>
			<span class="font-heading text-sm font-semibold tracking-[0.2em] text-gold-300 uppercase">
				{title}
			</span>
			<span aria-hidden="true" class="h-px flex-1 bg-linear-to-r from-gold-700/80 to-transparent"
			></span>
		</span>
		{#if description}
			<span class="mt-1.5 block text-sm text-subtle-foreground">{description}</span>
		{/if}
	</legend>

	{@render children()}
</fieldset>

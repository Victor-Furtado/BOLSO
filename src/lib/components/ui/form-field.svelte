<script lang="ts" module>
	export const inputClass =
		'block w-full rounded-md border border-border bg-input px-3 py-2.5 text-base text-foreground shadow-inner shadow-black/40 transition-colors placeholder:text-subtle-foreground hover:border-border-strong focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 focus:outline-none user-invalid:border-danger user-invalid:focus:ring-danger/25';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/ui';

	type Props = {
		id: string;
		label: string;
		required?: boolean;
		hint?: string;
		/** Spoken after the label for screen readers, e.g. "centímetros". */
		unitName?: string;
		aside?: Snippet;
		class?: string;
		children: Snippet;
	};

	let {
		id,
		label,
		required = false,
		hint,
		unitName,
		aside,
		class: className,
		children
	}: Props = $props();
</script>

<div class={cn('flex min-w-0 flex-col gap-1.5', className)}>
	<div class="flex items-baseline justify-between gap-3">
		<label for={id} class="text-sm font-medium text-muted-foreground">
			{label}{#if unitName}<span class="sr-only">&nbsp;em {unitName}</span>{/if}
			{#if required}
				<span class="ml-0.5 text-primary-400" aria-hidden="true">*</span>
			{/if}
		</label>
		{#if aside}
			<div class="text-xs text-subtle-foreground tabular-nums">{@render aside()}</div>
		{/if}
	</div>

	{@render children()}

	{#if hint}
		<p id="{id}-hint" class="text-xs text-subtle-foreground">{hint}</p>
	{/if}
</div>

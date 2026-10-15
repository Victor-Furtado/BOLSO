<script lang="ts">
	import { cn } from '$lib/utils/ui';
	import type { Snippet } from 'svelte';

	type Props = {
		pending: boolean;
		class?: string;
		children: Snippet;
	};

	let { pending, class: className, children }: Props = $props();
</script>

<button
	type="submit"
	disabled={pending}
	aria-busy={pending}
	class={cn(className, 'disabled:cursor-progress')}
>
	{#if pending}
		<span
			class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:hidden"
			aria-hidden="true"
		></span>
		<span class="animate-fade-in motion-reduce:animate-none">Enviando…</span>
	{:else}
		{@render children()}
	{/if}
</button>

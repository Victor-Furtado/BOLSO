<script lang="ts">
	import { cn } from '$lib/utils/ui';

	let { class: className }: { class?: string } = $props();
</script>

<span
	aria-hidden="true"
	class={cn(
		'pointer-events-none absolute size-2 rotate-45 border border-gold-500 bg-surface',
		className
	)}
></span>

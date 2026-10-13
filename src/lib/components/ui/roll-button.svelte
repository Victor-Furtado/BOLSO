<script lang="ts">
	import { cn } from '$lib/utils/ui';
	import { Dices } from 'lucide-svelte';

	type Props = {
		label: string;
		onroll: () => void;
		class?: string;
	};

	let { label, onroll, class: className }: Props = $props();

	let rolls = $state(0);

	function roll() {
		rolls++;
		onroll();
	}
</script>

<button
	type="button"
	aria-label={label}
	title={label}
	onclick={roll}
	class={cn(
		'inline-flex size-9 items-center justify-center rounded-md text-gold-400 transition-colors outline-none hover:bg-surface-hover hover:text-gold-200 focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
		className
	)}
>
	{#key rolls}
		<Dices class={cn('size-5', rolls > 0 && 'animate-dice-roll motion-reduce:animate-none')} />
	{/key}
</button>

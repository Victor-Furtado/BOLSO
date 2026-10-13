<script lang="ts">
	import { abilityLabels, type Boost } from '$lib/char-gen/ancestry';
	import { cn } from '$lib/utils/ui';

	type Props = {
		boosts: Boost[][];
		size?: 'sm' | 'md';
		class?: string;
	};

	let { boosts, size = 'sm', class: className }: Props = $props();

	const isFree = (options: Boost[]) => options.includes('FREE');
</script>

<span class={cn('flex flex-wrap gap-1', className)}>
	<span class="sr-only">Atributos:</span>
	{#each boosts as options, index (index)}
		<span
			class={cn(
				'inline-flex items-center rounded-full border leading-none font-semibold whitespace-nowrap',
				size === 'sm' ? 'px-1.5 py-[0.2rem] text-[0.65rem]' : 'px-2 py-1 text-xs',
				isFree(options)
					? 'border-dashed border-gold-600 text-gold-200'
					: 'border-gold-600 bg-gold-800/50 text-gold-100'
			)}
		>
			<span aria-hidden="true">
				+{isFree(options)
					? abilityLabels.FREE.short
					: options.map((o) => abilityLabels[o].short).join('/')}
			</span>
			<span class="sr-only">
				{isFree(options)
					? 'aumento livre'
					: `aumento de ${options.map((o) => abilityLabels[o].full).join(' ou ')}`},
			</span>
		</span>
	{/each}
</span>

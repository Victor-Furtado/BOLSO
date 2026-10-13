<script lang="ts">
	import { abilityLabels, type AncestryOption } from '$lib/char-gen/ancestry';
	import { creatureTraitMap, getLabel } from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';

	type Props = {
		ancestry: Pick<AncestryOption, 'traits' | 'boosts' | 'flaws'>;
		size?: 'sm' | 'md';
		class?: string;
	};

	let { ancestry, size = 'sm', class: className }: Props = $props();

	const pill = $derived(
		cn(
			'inline-flex items-center rounded-full border leading-none font-semibold whitespace-nowrap',
			size === 'sm' ? 'px-1.5 py-[0.2rem] text-[0.65rem]' : 'px-2 py-1 text-xs'
		)
	);
</script>

<span class={cn('flex flex-col', size === 'sm' ? 'gap-1' : 'gap-1.5', className)}>
	{#if ancestry.traits.length}
		<span class="flex flex-wrap gap-1">
			<span class="sr-only">Traços:</span>
			{#each ancestry.traits as trait (trait)}
				<span
					class={cn(
						pill,
						'border-gold-800 bg-background/50 tracking-wider text-gold-300 uppercase'
					)}
				>
					{getLabel(creatureTraitMap, trait)}
				</span>
			{/each}
		</span>
	{/if}

	<span class="flex flex-wrap gap-1">
		<span class="sr-only">Atributos:</span>
		{#each ancestry.boosts as boost, index (index)}
			<span
				class={cn(
					pill,
					boost === 'FREE'
						? 'border-dashed border-gold-600 text-gold-200'
						: 'border-gold-600 bg-gold-800/50 text-gold-100'
				)}
			>
				<span aria-hidden="true">+{abilityLabels[boost].short}</span>
				<span class="sr-only">
					{boost === 'FREE' ? 'aumento livre' : `aumento de ${abilityLabels[boost].full}`},
				</span>
			</span>
		{/each}
		{#each ancestry.flaws as flaw, index (index)}
			<span class={cn(pill, 'border-primary-700 bg-primary-950/70 text-primary-200')}>
				<span aria-hidden="true">−{abilityLabels[flaw].short}</span>
				<span class="sr-only">falha em {abilityLabels[flaw].full},</span>
			</span>
		{/each}
	</span>
</span>

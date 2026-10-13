<script lang="ts" module>
	import type { BoostSource } from '$lib/char-gen/build';

	export const boostSourceStyles: Record<BoostSource, { label: string; class: string }> = {
		ancestry: { label: 'Ancestralidade', class: 'bg-gold-400' },
		background: { label: 'Antecedente', class: 'bg-rarity-uncommon' },
		class: { label: 'Classe', class: 'bg-primary-400' },
		free: { label: 'Livre', class: 'bg-foreground/70' }
	};
</script>

<script lang="ts">
	import { abilityLabels, type Ability } from '$lib/char-gen/ancestry';
	import { abilities, formatModifier, type AttributeScore } from '$lib/char-gen/build';
	import { cn } from '$lib/utils/ui';

	type Props = {
		scores: Record<Ability, AttributeScore>;
		/** Highlights the class's key attribute. */
		keyAbility?: Ability | null;
		legend?: boolean;
		class?: string;
	};

	let { scores, keyAbility = null, legend = true, class: className }: Props = $props();
</script>

<div class={cn('flex flex-col gap-3', className)}>
	<dl class="grid grid-cols-3 gap-2">
		{#each abilities as ability (ability)}
			{@const score = scores[ability]}
			<div
				class={cn(
					'relative flex flex-col items-center rounded-md border px-2 pt-2 pb-2.5 text-center transition-colors',
					ability === keyAbility
						? 'border-gold-500 bg-gold-900/40'
						: 'border-border-strong bg-surface-raised/70'
				)}
			>
				<dt
					class="text-[0.65rem] font-semibold tracking-[0.15em] text-subtle-foreground uppercase"
					title={abilityLabels[ability].full}
				>
					<span aria-hidden="true">{abilityLabels[ability].short}</span>
					<span class="sr-only">{abilityLabels[ability].full}</span>
					{#if ability === keyAbility}
						<span class="sr-only">(atributo-chave)</span>
					{/if}
				</dt>
				<dd
					class={cn(
						'font-heading text-2xl leading-tight font-bold tabular-nums',
						score.modifier > 0
							? 'text-gold-100'
							: score.modifier < 0
								? 'text-primary-300'
								: 'text-muted-foreground'
					)}
				>
					{formatModifier(score.modifier)}
				</dd>
				<dd aria-hidden="true" class="mt-1 flex h-1.5 items-center gap-1">
					{#each score.boosts as source, index (index)}
						<span class={cn('size-1.5 rotate-45', boostSourceStyles[source].class)}></span>
					{/each}
					{#each { length: score.flaws }, index (index)}
						<span class="size-1.5 rotate-45 border border-primary-400"></span>
					{/each}
				</dd>
			</div>
		{/each}
	</dl>

	{#if legend}
		<ul
			aria-hidden="true"
			class="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-subtle-foreground"
		>
			{#each Object.entries(boostSourceStyles) as [source, style] (source)}
				<li class="inline-flex items-center gap-1.5">
					<span class={cn('size-1.5 rotate-45', style.class)}></span>
					{style.label}
				</li>
			{/each}
			<li class="inline-flex items-center gap-1.5">
				<span class="size-1.5 rotate-45 border border-primary-400"></span>
				Falha
			</li>
		</ul>
	{/if}
</div>

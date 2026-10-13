<script lang="ts">
	import { abilityLabels } from '$lib/char-gen/ancestry';
	import { classRarityLabels, type ClassOption } from '$lib/char-gen/class';
	import { cn } from '$lib/utils/ui';
	import { Check, Heart, KeyRound, WandSparkles } from 'lucide-svelte';
	import RarityBadge from './rarity-badge.svelte';

	type Props = {
		option: ClassOption;
		selected?: boolean;
		onclick: () => void;
	};

	let { option, selected = false, onclick }: Props = $props();

	const keyAbility = $derived(
		option.keyAbilities.length
			? option.keyAbilities.map((ability) => abilityLabels[ability].short).join('/')
			: 'Subclasse'
	);
</script>

<button
	type="button"
	{onclick}
	aria-haspopup="dialog"
	class={cn(
		'group relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-surface-raised text-left shadow-lg shadow-black/40 transition-[border-color,box-shadow,translate] duration-200 outline-none hover:-translate-y-0.5 hover:border-gold-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:hover:translate-y-0',
		selected ? 'border-gold-400 ring-1 shadow-primary-900/70 ring-gold-400/50' : 'border-border'
	)}
>
	<span
		class="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-radial-[at_50%_45%] from-primary-900/50 via-background/60 to-background"
	>
		<span
			aria-hidden="true"
			class="absolute size-28 rotate-45 border border-gold-800/50 transition-colors duration-300 group-hover:border-gold-700/70 sm:size-32"
		></span>
		<img
			src={option.image}
			alt=""
			loading="lazy"
			decoding="async"
			width="256"
			height="245"
			class="relative size-24 object-contain drop-shadow-[0_6px_10px_rgb(0_0_0/0.6)] transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100 sm:size-28"
		/>

		<span class="absolute top-2 left-2 flex flex-col items-start gap-1">
			{#if option.rarity !== 'common'}
				<RarityBadge rarity={option.rarity} label={classRarityLabels[option.rarity].singular} />
			{/if}
			{#if option.legacy}
				<span
					class="rounded-sm border border-border-strong bg-background/85 px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-muted-foreground uppercase"
				>
					Legado
				</span>
			{/if}
		</span>

		{#if selected}
			<span
				class="absolute top-2.5 right-2.5 flex size-7 rotate-45 items-center justify-center border border-gold-300 bg-primary-700 shadow-md shadow-black/60"
			>
				<Check class="size-4 -rotate-45 text-gold-100" strokeWidth={3} />
			</span>
		{/if}
	</span>

	<span class="flex flex-1 flex-col gap-2 border-t border-border/70 px-3 pt-2.5 pb-3">
		<span class="block truncate font-heading text-lg leading-tight font-semibold text-gold-100">
			{option.name}
		</span>
		<span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
			<span class="inline-flex items-center gap-1 tabular-nums">
				<Heart class="size-3 text-primary-400" aria-hidden="true" />
				<span class="sr-only">Pontos de vida por nível:</span>
				{option.hp}
			</span>
			<span class="inline-flex items-center gap-1">
				<KeyRound class="size-3 text-gold-500" aria-hidden="true" />
				<span class="sr-only">Atributo-chave:</span>
				{keyAbility}
			</span>
			{#if option.spellcaster}
				<span class="inline-flex items-center gap-1 text-gold-300">
					<WandSparkles class="size-3" aria-hidden="true" />
					Conjurador
				</span>
			{/if}
		</span>
		{#if selected}
			<span class="sr-only">(escolhida)</span>
		{/if}
	</span>
</button>

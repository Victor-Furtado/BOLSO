<script lang="ts">
	import type { AncestryOption } from '$lib/char-gen/ancestry';
	import { cn } from '$lib/utils/ui';
	import { Check, Footprints, Heart } from 'lucide-svelte';
	import AncestryPills from './ancestry-pills.svelte';
	import RarityBadge from './rarity-badge.svelte';

	type Props = {
		ancestry: AncestryOption;
		selected?: boolean;
		onclick: () => void;
	};

	let { ancestry, selected = false, onclick }: Props = $props();
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
	<span class="relative block aspect-square overflow-hidden bg-background">
		<img
			src={ancestry.image}
			alt=""
			loading="lazy"
			decoding="async"
			width="256"
			height="256"
			class="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
		/>
		<span
			aria-hidden="true"
			class="absolute inset-0 bg-linear-to-t from-surface-raised via-surface-raised/5 to-transparent"
		></span>

		<span class="absolute top-2 left-2 flex flex-col items-start gap-1">
			{#if ancestry.rarity !== 'common'}
				<RarityBadge rarity={ancestry.rarity} />
			{/if}
			{#if ancestry.legacy}
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

	<span class="relative -mt-7 block px-3 pb-3">
		<span class="block truncate font-heading text-lg leading-tight font-semibold text-gold-100">
			{ancestry.name}
		</span>
		<span class="mt-1 flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
			<span class="inline-flex items-center gap-1">
				<Heart class="size-3 text-primary-400" aria-hidden="true" />
				<span class="sr-only">Pontos de vida:</span>
				{ancestry.hp}
			</span>
			<span class="inline-flex items-center gap-1">
				<Footprints class="size-3 text-gold-500" aria-hidden="true" />
				<span class="sr-only">Deslocamento:</span>
				{ancestry.speed} pés
			</span>
		</span>
		<AncestryPills {ancestry} class="mt-2.5" />
		{#if selected}
			<span class="sr-only">(escolhida)</span>
		{/if}
	</span>
</button>

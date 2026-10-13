<script lang="ts">
	import { RadioGroup } from 'bits-ui';
	import type { HeritageOption } from '$lib/char-gen/ancestry';
	import { cn } from '$lib/utils/ui';
	import { Check, Sparkles } from 'lucide-svelte';
	import FeaturePopover from './feature-popover.svelte';
	import RarityBadge from './rarity-badge.svelte';

	type Props = {
		heritages: HeritageOption[];
		value: string | null;
		label: string;
		fallbackImage: string;
	};

	let { heritages, value = $bindable(null), label, fallbackImage }: Props = $props();

	const id = $props.id();

	const groups = $derived(
		[
			{
				key: 'lineage',
				title: 'Heranças da ancestralidade',
				items: heritages.filter((h) => !h.versatile)
			},
			{ key: 'versatile', title: 'Heranças versáteis', items: heritages.filter((h) => h.versatile) }
		].filter((group) => group.items.length > 0)
	);
</script>

{#snippet heritageCard(heritage: HeritageOption, index: number)}
	<RadioGroup.Item
		value={heritage.id}
		class="group relative flex h-full w-full animate-page-in gap-4 rounded-lg border border-border bg-surface-raised/70 p-4 text-left shadow-md shadow-black/30 transition-[border-color,background-color] duration-200 outline-none hover:border-gold-800 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface data-[state=checked]:border-gold-400 data-[state=checked]:bg-primary-950/50 motion-reduce:animate-none sm:p-5"
		style="animation-delay: {Math.min(index, 10) * 40}ms"
	>
		{#snippet children({ checked })}
			<span
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 rounded-lg bg-radial-[at_0%_0%] from-primary-700/25 to-transparent to-60% opacity-0 transition-opacity duration-300 group-data-[state=checked]:opacity-100"
			></span>

			<span
				class="relative mt-1 ml-1 size-12 shrink-0 rotate-45 overflow-hidden border-2 border-gold-700 bg-background shadow-lg shadow-black/50 transition-colors duration-200 group-data-[state=checked]:border-gold-300 sm:size-14"
			>
				<img
					src={heritage.image ?? fallbackImage}
					alt=""
					loading="lazy"
					decoding="async"
					width="64"
					height="64"
					class={cn(
						'size-full scale-[1.42] -rotate-45 object-cover',
						!heritage.image &&
							'opacity-70 sepia-[0.6] transition-[opacity,filter] duration-200 group-data-[state=checked]:opacity-100 group-data-[state=checked]:sepia-0'
					)}
				/>
			</span>

			<span class="relative flex min-w-0 flex-1 flex-col gap-1.5">
				<span class="flex items-start justify-between gap-3">
					<span class="font-heading text-lg leading-tight font-semibold text-gold-100">
						{heritage.name}
					</span>
					<span
						aria-hidden="true"
						class={cn(
							'mt-0.5 flex size-5 shrink-0 rotate-45 items-center justify-center border transition-colors duration-200',
							checked ? 'border-gold-300 bg-primary-700' : 'border-border-strong bg-background'
						)}
					>
						{#if checked}
							<Check class="size-3 -rotate-45 text-gold-100" strokeWidth={3.5} />
						{/if}
					</span>
				</span>

				{#if heritage.rarity !== 'common' || heritage.legacy}
					<span class="flex flex-wrap gap-1.5">
						{#if heritage.rarity !== 'common'}
							<RarityBadge rarity={heritage.rarity} />
						{/if}
						{#if heritage.legacy}
							<span
								class="rounded-sm border border-border-strong px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-muted-foreground uppercase"
							>
								Legado
							</span>
						{/if}
					</span>
				{/if}

				{#if heritage.description}
					<span
						class={cn('text-sm leading-relaxed text-muted-foreground', !checked && 'line-clamp-3')}
					>
						{heritage.description}
					</span>
				{/if}

				{#if heritage.grants.length}
					<span class="mt-1 flex flex-wrap items-center gap-1.5">
						<span
							class="inline-flex items-center gap-1 text-[0.7rem] font-semibold tracking-wider text-gold-400 uppercase"
						>
							<Sparkles class="size-3" aria-hidden="true" />
							Concede
						</span>
						{#each heritage.grants as grant (grant.name)}
							<FeaturePopover
								feature={grant}
								nested
								class="rounded-md border border-gold-800 bg-gold-900/40 px-2 py-0.5 text-xs text-gold-100 transition-colors hover:border-gold-600"
							/>
						{/each}
					</span>
				{/if}
			</span>
		{/snippet}
	</RadioGroup.Item>
{/snippet}

<RadioGroup.Root
	bind:value={() => value ?? '', (next) => (value = next || null)}
	aria-label={label}
>
	<div class="flex flex-col gap-8">
		{#each groups as group (group.key)}
			<section aria-labelledby="{id}-{group.key}">
				<h3 id="{id}-{group.key}" class="mb-4 flex items-center gap-3">
					<span aria-hidden="true" class="size-1.5 shrink-0 rotate-45 bg-gold-400"></span>
					<span
						class="font-heading text-xs font-semibold tracking-[0.12em] text-gold-300 uppercase sm:text-sm sm:tracking-[0.2em]"
					>
						{group.title}
					</span>
					<span class="text-xs text-subtle-foreground tabular-nums">{group.items.length}</span>
					<span
						aria-hidden="true"
						class="h-px flex-1 bg-linear-to-r from-gold-700/80 to-transparent"
					></span>
				</h3>
				<div class="grid gap-3 lg:grid-cols-2 lg:gap-4">
					{#each group.items as heritage, index (heritage.id)}
						{@render heritageCard(heritage, index)}
					{/each}
				</div>
			</section>
		{/each}
	</div>
</RadioGroup.Root>

<script lang="ts">
	import { Check, ChevronDown, Eye, Heart, Languages, Move, Ruler, Sparkles } from 'lucide-svelte';
	import { ancestrySizeMap, ancestryVisionMap, getMappedValue } from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import type { Ancestry, Feat } from '$lib/server/catalog/types';

	let { ancestries }: { ancestries: Ancestry[] } = $props();

	let selectedAncestry = $state<Ancestry | null>(null);
	let descriptionExpanded = $state(false);
	let featsExpanded = $state(false);

	const visionShortMap = {
		normal: 'Normal',
		darkvision: 'Escuro',
		'low-light-vision': 'Penumbra'
	} as const;

	const actionTypeLabel: Record<Feat['data']['actionType'], string> = {
		passive: 'Passivo',
		single: '1 ação',
		two_actions: '2 ações',
		three_actions: '3 ações',
		free: 'Livre',
		reaction: 'Reação'
	};

	const selectedStats = $derived(
		selectedAncestry
			? [
					{ label: 'Vitalidade', value: `${selectedAncestry.data.hp} PV`, Icon: Heart },
					{ label: 'Movimento', value: `${selectedAncestry.data.speed} pés`, Icon: Move },
					{
						label: 'Tamanho',
						value: getMappedValue(ancestrySizeMap, selectedAncestry.data.size) ?? '—',
						Icon: Ruler
					},
					{
						label: 'Visão',
						value:
							getMappedValue(visionShortMap, selectedAncestry.data.vision) ??
							selectedAncestry.data.vision,
						detail: getMappedValue(ancestryVisionMap, selectedAncestry.data.vision) ?? '',
						Icon: Eye
					}
				]
			: []
	);

	const cleanedDescription = $derived(
		selectedAncestry ? cleanDescription(selectedAncestry.description) : ''
	);
	const hasLongDescription = $derived(cleanedDescription.length > 160);

	// Reset expansions when the selection changes.
	$effect(() => {
		if (selectedAncestry) {
			descriptionExpanded = false;
			featsExpanded = false;
		}
	});

	function cleanDescription(description: string | null): string {
		return (
			description
				?.replace(/@UUID\[[^\]]*\]\{([^}]*)\}/g, '$1')
				.replace(/@[^\s<]*/g, '')
				.replace(/<\/?p>/g, '')
				.replace(/<\/?em>/g, '')
				.trim() ?? ''
		);
	}
</script>

<div class="flex min-h-0 flex-col gap-5">
	<section
		class={cn(
			'grid overflow-hidden rounded-lg border border-border bg-surface',
			'transition-[grid-template-rows,opacity] duration-300 ease-in-out',
			selectedAncestry ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] border-0 opacity-0'
		)}
	>
		<div class="min-h-0 overflow-hidden">
			{#if selectedAncestry}
				<div class="flex flex-col gap-3 p-3 sm:p-4">
					<!-- Header: thumbnail + name + inline stats/chips -->
					<div class="flex items-start gap-3">
						<div
							class="size-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface-raised sm:size-20"
						>
							<img
								src={selectedAncestry.image}
								alt={selectedAncestry.name}
								class="size-full object-contain object-center p-1.5"
							/>
						</div>

						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] font-semibold tracking-wide text-primary-400 uppercase">
									Selecionada
								</span>
								<Check size={12} class="text-primary-400" />
							</div>
							<h2 class="truncate text-base font-semibold text-foreground sm:text-lg">
								{selectedAncestry.name}
							</h2>

							<!-- Combat stats + boosts/flaws as inline chips -->
							<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
								{#each selectedStats as stat (stat.label)}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[11px]"
										title={stat.detail ? `${stat.label}: ${stat.detail}` : stat.label}
									>
										<stat.Icon size={11} class="text-primary-300" />
										<span class="font-medium text-foreground">{stat.value}</span>
									</span>
								{/each}

								{#each selectedAncestry.data.boosts as boost, index (index)}
									<span
										class="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success"
									>
										+{boost}
									</span>
								{/each}
								{#each selectedAncestry.data.flaws as flaw, index (index)}
									<span
										class="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-medium text-danger"
									>
										-{flaw}
									</span>
								{/each}
							</div>

							<!-- Traits -->
							{#if selectedAncestry.traits.length}
								<div class="mt-1.5 flex flex-wrap gap-1">
									{#each selectedAncestry.traits as trait (trait)}
										<span
											class="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
										>
											{trait}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Description (clamped, expandable) -->
					{#if cleanedDescription}
						<div>
							<p
								class={cn(
									'text-xs leading-5 text-muted-foreground',
									!descriptionExpanded && 'line-clamp-2'
								)}
							>
								<!-- Official PF2E descriptions are trusted catalog content. -->
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html cleanedDescription}
							</p>
							{#if hasLongDescription}
								<button
									type="button"
									class="mt-1 text-[11px] font-medium text-primary-400 transition-colors hover:text-primary-300"
									onclick={() => (descriptionExpanded = !descriptionExpanded)}
								>
									{descriptionExpanded ? 'Ver menos' : 'Ver mais'}
								</button>
							{/if}
						</div>
					{/if}

					<!-- Languages inline -->
					<div
						class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2.5 text-[11px]"
					>
						<span class="inline-flex items-center gap-1.5">
							<Languages size={12} class="text-primary-300" />
							<span class="text-subtle-foreground">Idiomas:</span>
							<span class="text-foreground/90"
								>{selectedAncestry.data.languages.join(', ') || '—'}</span
							>
						</span>
						{#if selectedAncestry.data.additionalLanguages.length}
							<span class="inline-flex items-center gap-1.5">
								<span class="text-subtle-foreground">Adicionais:</span>
								<span class="text-foreground/90">
									{selectedAncestry.data.additionalLanguages.join(', ')}
								</span>
							</span>
						{/if}
					</div>

					<!-- Ancestral feats (collapsible) -->
					<div>
						<button
							type="button"
							class="flex w-full items-center justify-between gap-2 rounded-md border border-border/70 bg-background/40 px-2.5 py-1.5 text-left transition-colors hover:border-border hover:bg-background/70"
							onclick={() => (featsExpanded = !featsExpanded)}
						>
							<span class="flex items-center gap-1.5">
								<Sparkles size={12} class="text-primary-300" />
								<span class="text-xs font-semibold text-foreground">Traços ancestrais</span>
								<span class="text-[10px] text-subtle-foreground">
									({selectedAncestry.feats.length})
								</span>
							</span>
							<ChevronDown
								size={14}
								class={cn(
									'text-subtle-foreground transition-transform duration-200',
									featsExpanded && 'rotate-180'
								)}
							/>
						</button>

						{#if featsExpanded}
							<div class="mt-2 max-h-52 space-y-2 overflow-y-auto overscroll-contain pr-1">
								{#if selectedAncestry.feats.length === 0}
									<p class="text-xs text-muted-foreground">
										Esta ancestralidade não concede features automáticas.
									</p>
								{:else}
									{#each selectedAncestry.feats as feat (feat.id)}
										<article
											class="rounded-md border border-border/70 bg-background/40 px-2.5 py-2"
										>
											<div class="mb-1 flex items-start justify-between gap-2">
												<h4 class="text-xs font-semibold text-foreground">{feat.name}</h4>
												<span
													class="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-subtle-foreground"
												>
													{actionTypeLabel[feat.data.actionType]}
												</span>
											</div>
											<p class="line-clamp-3 text-[11px] leading-4 text-muted-foreground">
												{cleanDescription(feat.description) || 'Sem descrição.'}
											</p>
										</article>
									{/each}
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Ancestry picker -->
	<section class="min-h-0 flex-1 overflow-y-auto pr-1">
		<div class="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
			<div>
				<h2 class="text-lg font-semibold text-foreground">Escolha uma ancestralidade</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Selecione uma opção para ver seus detalhes.
				</p>
			</div>
			<span class="text-xs text-subtle-foreground">{ancestries.length} opções</span>
		</div>

		<div
			class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
		>
			{#each ancestries as ancestry (ancestry.id)}
				{@const isSelected = selectedAncestry?.id === ancestry.id}
				<button
					type="button"
					aria-pressed={isSelected}
					class={cn(
						'group relative flex flex-col overflow-hidden rounded-lg border bg-surface text-left',
						'transition-[transform,border-color,box-shadow,background-color] duration-200',
						'hover:-translate-y-0.5 hover:border-primary-500/60 hover:shadow-lg hover:shadow-primary-950/20',
						'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
						isSelected
							? 'border-primary-500 bg-primary-950/20 ring-1 ring-primary-500/50'
							: 'border-border'
					)}
					onclick={() => (selectedAncestry = ancestry)}
				>
					<!-- Image -->
					<div
						class="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-surface-raised to-background"
					>
						<img
							src={ancestry.image}
							alt=""
							loading="lazy"
							decoding="async"
							class="absolute inset-0 size-full object-contain object-center p-2.5 opacity-90 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
						/>

						{#if isSelected}
							<div
								class="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary-500 text-white shadow-md"
							>
								<Check size={14} strokeWidth={3} />
							</div>
						{/if}
					</div>

					<!-- Body -->
					<div class="flex flex-1 flex-col gap-2 p-2.5 sm:p-3">
						<div class="min-w-0">
							<h3 class="truncate text-sm font-semibold text-foreground">{ancestry.name}</h3>
							<p class="mt-0.5 text-[10px] text-subtle-foreground">
								{ancestry.feats.length}
								{ancestry.feats.length === 1 ? 'feature' : 'features'}
							</p>
						</div>

						<div class="mt-auto flex min-h-5 flex-wrap content-start gap-1">
							{#each ancestry.data.boosts as boost, index (index)}
								<span
									class="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success"
								>
									+{boost}
								</span>
							{/each}
							{#each ancestry.data.flaws as flaw, index (index)}
								<span
									class="rounded-full bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold text-danger"
								>
									-{flaw}
								</span>
							{/each}
						</div>
					</div>
				</button>
			{/each}
		</div>
	</section>
</div>

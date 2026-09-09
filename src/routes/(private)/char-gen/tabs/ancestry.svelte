<script lang="ts">
	import { Check, Eye, Heart, Languages, Move, Ruler, Sparkles } from 'lucide-svelte';
	import { ancestrySizeMap, ancestryVisionMap, getMappedValue } from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import type { Ancestry, Feat } from '$lib/server/catalog/types';

	let { ancestries }: { ancestries: Ancestry[] } = $props();

	let selectedAncestry = $state<Ancestry | null>(null);

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
					{
						label: 'Vitalidade',
						value: `${selectedAncestry.data.hp} PV`,
						Icon: Heart
					},
					{
						label: 'Movimento',
						value: `${selectedAncestry.data.speed} pés`,
						Icon: Move
					},
					{
						label: 'Tamanho',
						value: getMappedValue(ancestrySizeMap, selectedAncestry.data.size) ?? '—',
						Icon: Ruler
					},
					{
						label: 'Visão',
						value: getMappedValue(visionShortMap, selectedAncestry.data.vision) ?? '—',
						detail: getMappedValue(ancestryVisionMap, selectedAncestry.data.vision) ?? '',
						Icon: Eye
					}
				]
			: []
	);

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

	function panelClass(...classes: string[]) {
		return cn(
			'flex h-52 flex-col overflow-hidden rounded-md border border-border bg-surface-raised p-3',
			...classes
		);
	}
</script>

<div class="flex min-h-0 flex-col gap-6">
	<section
		class={cn([
			'grid overflow-hidden rounded-lg border border-border bg-surface',
			'transition-[grid-template-rows,opacity] duration-300 ease-in-out',
			selectedAncestry ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] border-0 opacity-0'
		])}
	>
		<div class="min-h-0 overflow-y-auto">
			{#if selectedAncestry}
				<div class="grid gap-3 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_11rem]">
					<div class="flex min-h-52 flex-col">
						<div class="mb-3 flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="mb-1 text-[11px] font-semibold text-primary-400 uppercase">
									Ancestralidade selecionada
								</p>
								<h2 class="truncate text-xl font-semibold text-foreground">
									{selectedAncestry.name}
								</h2>
							</div>
							<div
								class="rounded-full border border-primary-500/30 bg-primary-950 p-2 text-primary-300"
							>
								<Check size={16} />
							</div>
						</div>

						{#key selectedAncestry.id}
							<div
								class="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 text-sm leading-5 text-muted-foreground"
							>
								<!-- Official PF2E descriptions are trusted catalog content. -->
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html cleanDescription(selectedAncestry.description)}
							</div>
						{/key}

						{#if selectedAncestry.traits.length}
							<div class="mt-3 flex flex-wrap gap-1.5">
								{#each selectedAncestry.traits as trait (trait)}
									<span
										class="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
									>
										{trait}
									</span>
								{/each}
							</div>
						{/if}
					</div>

					<div
						class="relative flex h-52 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-raised"
					>
						<img
							src={selectedAncestry.image}
							alt={selectedAncestry.name}
							class="size-full object-contain object-center p-3"
						/>
					</div>
				</div>

				<div class="grid gap-3 border-t border-border p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
					<div class={panelClass()}>
						<h3 class="mb-2 text-xs font-semibold text-foreground">Combate</h3>
						<div class="grid min-h-0 flex-1 grid-cols-2 content-start gap-2">
							{#each selectedStats as stat (stat.label)}
								<div
									class="rounded-md border border-border/70 bg-background/50 px-2 py-1.5"
									title={stat.detail ? `${stat.label}: ${stat.detail}` : undefined}
								>
									<div class="mb-1 flex items-center gap-1.5 text-primary-300">
										<stat.Icon size={12} />
										<span
											class="text-[10px] font-medium tracking-wide text-subtle-foreground uppercase"
										>
											{stat.label}
										</span>
									</div>
									<p class="truncate text-sm font-semibold text-foreground">{stat.value}</p>
								</div>
							{/each}
						</div>
					</div>

					<div class={panelClass()}>
						<h3 class="mb-2 text-xs font-semibold text-foreground">Atributos</h3>
						<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
							{#if selectedAncestry.data.boosts.length || selectedAncestry.data.flaws.length}
								<div class="flex flex-wrap gap-1.5">
									{#each selectedAncestry.data.boosts as boost, index (index)}
										<span
											class="rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success"
										>
											+{boost}
										</span>
									{/each}
									{#each selectedAncestry.data.flaws as flaw, index (index)}
										<span
											class="rounded-md bg-danger/15 px-2 py-0.5 text-[11px] font-medium text-danger"
										>
											-{flaw}
										</span>
									{/each}
								</div>
							{:else}
								<p class="text-xs text-muted-foreground">Sem aumentos ou fraquezas fixos.</p>
							{/if}
						</div>
					</div>

					<div class={panelClass()}>
						<div class="mb-2 flex items-center gap-1.5">
							<Languages size={14} class="text-primary-300" />
							<h3 class="text-xs font-semibold text-foreground">Idiomas</h3>
						</div>
						<div class="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
							<div>
								<p
									class="mb-1 text-[10px] font-medium tracking-wide text-subtle-foreground uppercase"
								>
									Conhecidos
								</p>
								<p class="text-xs leading-5 text-muted-foreground">
									{selectedAncestry.data.languages.join(', ') || '—'}
								</p>
							</div>
							{#if selectedAncestry.data.additionalLanguages.length}
								<div>
									<p
										class="mb-1 text-[10px] font-medium tracking-wide text-subtle-foreground uppercase"
									>
										Adicionais
									</p>
									<p class="text-xs leading-5 text-muted-foreground">
										{selectedAncestry.data.additionalLanguages.join(', ')}
									</p>
								</div>
							{/if}
						</div>
					</div>

					<div class={panelClass()}>
						<div class="mb-2 flex items-center justify-between gap-2">
							<div class="flex items-center gap-1.5">
								<Sparkles size={14} class="text-primary-300" />
								<h3 class="text-xs font-semibold text-foreground">Traços ancestrais</h3>
							</div>
							<span class="text-[10px] text-subtle-foreground">
								{selectedAncestry.feats.length}
							</span>
						</div>
						<div class="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
							{#if selectedAncestry.feats.length === 0}
								<p class="text-xs text-muted-foreground">
									Esta ancestralidade não concede features automáticas.
								</p>
							{:else}
								{#each selectedAncestry.feats as feat (feat.id)}
									<article class="rounded-md border border-border/70 bg-background/40 px-2.5 py-2">
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
					</div>
				</div>
			{/if}
		</div>
	</section>

	<section class="min-h-0 flex-1 overflow-y-auto pr-1">
		<div class="mb-3 flex items-end justify-between gap-4">
			<div>
				<h2 class="text-lg font-semibold text-foreground">Escolha uma ancestralidade</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Selecione uma opção para ver seus detalhes.
				</p>
			</div>
			<span class="text-xs text-subtle-foreground">{ancestries.length} opções</span>
		</div>

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
			{#each ancestries as ancestry (ancestry.id)}
				<button
					type="button"
					class={cn(
						'group flex h-full min-h-56 w-full flex-col overflow-hidden rounded-md border bg-surface text-left transition-colors hover:border-primary-500 hover:bg-surface-raised',
						selectedAncestry?.id === ancestry.id
							? 'border-primary-500 ring-1 ring-primary-500'
							: 'border-border'
					)}
					onclick={() => (selectedAncestry = ancestry)}
				>
					<div class="relative aspect-square w-full shrink-0 overflow-hidden bg-surface-raised">
						<img
							src={ancestry.image}
							alt=""
							class="absolute inset-0 size-full object-contain object-center p-2 opacity-80 transition-opacity group-hover:opacity-100"
						/>
					</div>
					<div class="flex min-h-0 flex-1 flex-col p-3">
						<div class="flex min-h-5 items-center justify-between gap-2">
							<h3 class="truncate text-sm font-semibold text-foreground">{ancestry.name}</h3>
							<span class="inline-flex size-4 shrink-0 items-center justify-center">
								{#if selectedAncestry?.id === ancestry.id}
									<Check size={15} class="text-primary-400" />
								{/if}
							</span>
						</div>
						<p class="mt-1 text-[10px] text-subtle-foreground">
							{ancestry.feats.length}
							{ancestry.feats.length === 1 ? 'feature' : 'features'}
						</p>
						<div class="mt-auto flex min-h-10 flex-wrap content-start gap-1 pt-2">
							{#each ancestry.data.boosts as boost, index (index)}
								<span
									class="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success"
								>
									+{boost}
								</span>
							{/each}
							{#each ancestry.data.flaws as flaw, index (index)}
								<span
									class="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-medium text-danger"
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

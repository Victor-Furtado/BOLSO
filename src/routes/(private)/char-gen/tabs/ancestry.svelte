<script lang="ts">
	import { Check, Heart, Languages, Move, Sparkles, Swords } from 'lucide-svelte';
	import { ancestrySizeMap, ancestryVisionMap, getMappedValue } from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import type { Ancestry } from '$lib/server/catalog/types';

	let { ancestries }: { ancestries: Ancestry[] } = $props();

	let selectedAncestry = $state<Ancestry | null>(null);

	const visionShortMap = {
		normal: 'Normal',
		darkvision: 'Escuro',
		'low-light-vision': 'Penumbra'
	} as const;

	const selectedStats = $derived([
		{
			label: 'Vitalidade',
			value: selectedAncestry ? `${selectedAncestry.data.hp} PV` : '',
			Icon: Heart
		},
		{
			label: 'Movimento',
			value: selectedAncestry ? `${selectedAncestry.data.speed} pés` : '',
			Icon: Move
		},
		{
			label: 'Tamanho',
			value: getMappedValue(ancestrySizeMap, selectedAncestry?.data.size) ?? '',
			Icon: Swords
		},
		{
			label: 'Visão',
			value: getMappedValue(visionShortMap, selectedAncestry?.data.vision) ?? '',
			detail: getMappedValue(ancestryVisionMap, selectedAncestry?.data.vision) ?? '',
			Icon: Sparkles
		}
	]);

	function cleanDescription(description: string | null): string {
		return description?.replace(/@[^\s<]*/g, '').trim() ?? '';
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
		<div class="min-h-0 flex-1 overflow-y-auto">
			<div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_14rem]">
				<div class="p-4 sm:p-5">
					<div class="mb-3 flex items-start justify-between gap-3">
						<div>
							<p class="mb-1 text-[11px] font-semibold text-primary-400 uppercase">
								Ancestralidade selecionada
							</p>
							<h2 class="text-xl font-semibold text-foreground">{selectedAncestry?.name}</h2>
						</div>
						<div
							class="rounded-full border border-primary-500/30 bg-primary-950 p-2 text-primary-300"
						>
							<Check size={16} />
						</div>
					</div>

					{#key selectedAncestry?.id}
						<div
							class="h-16 max-h-16 min-h-16 max-w-3xl shrink-0 overflow-y-auto overscroll-contain pr-2 text-sm leading-5 text-muted-foreground"
						>
							<!-- Official PF2E descriptions are trusted catalog content. -->
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html cleanDescription(selectedAncestry?.description ?? null)}
						</div>
					{/key}

					<div
						class="mt-4 flex divide-x divide-border overflow-x-auto rounded-md border border-border bg-surface-raised"
					>
						{#each selectedStats as stat (stat.label)}
							<div
								class="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2"
								title="{stat.label}: {stat.detail ?? stat.value}"
							>
								<span
									class="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary-500/25 bg-primary-950 text-primary-300"
								>
									<stat.Icon size={13} />
								</span>
								<div class="min-w-0">
									<p
										class="truncate text-[10px] font-medium tracking-wide text-subtle-foreground uppercase"
									>
										{stat.label}
									</p>
									<p class="truncate text-sm font-semibold text-foreground">{stat.value}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div
					class="relative flex h-40 items-center justify-center overflow-hidden border-t border-border bg-surface-raised lg:h-auto lg:min-h-56 lg:self-stretch lg:border-t-0 lg:border-l"
				>
					<div class="relative aspect-square w-40 shrink-0 lg:w-full">
						<img
							src={selectedAncestry?.image}
							alt={selectedAncestry?.name}
							class="absolute inset-0 size-full object-contain object-center p-2"
						/>
					</div>
					<div
						class="absolute inset-x-0 bottom-0 bg-linear-to-t from-surface-raised to-transparent p-3 pt-10"
					>
						<div class="flex flex-wrap gap-1.5">
							{#each selectedAncestry?.traits ? JSON.parse(selectedAncestry.traits) : [] as trait (trait)}
								<span
									class="rounded-full border border-border bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground"
								>
									{trait}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="grid gap-4 border-t border-border p-4 sm:grid-cols-2 sm:p-5">
				<div>
					<h3 class="mb-2 text-xs font-semibold text-foreground">Aumentos e fraquezas</h3>
					<div class="flex min-h-7 flex-wrap gap-1.5">
						{#each selectedAncestry?.data.boosts ?? [] as boost (boost)}
							<span
								class="my-auto rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success"
								>+{boost}</span
							>
						{/each}
						{#each selectedAncestry?.data.flaws ?? [] as flaw (flaw)}
							<span
								class="my-auto rounded-md bg-danger/15 px-2 py-0.5 text-[11px] font-medium text-danger"
								>-{flaw}</span
							>
						{/each}
					</div>
				</div>
				<div>
					<div class="mb-2 flex items-center gap-1.5">
						<Languages size={14} class="text-primary-300" />
						<h3 class="text-xs font-semibold text-foreground">Idiomas</h3>
					</div>
					<p class="text-xs text-muted-foreground">
						{selectedAncestry?.data.languages.join(', ')}
					</p>
				</div>
			</div>

			<div class="border-t border-border p-4 sm:p-5">
				<h3 class="mb-2 text-xs font-semibold text-foreground">Traços ancestrais</h3>
				<div class="h-24 space-y-2 overflow-y-auto overscroll-contain pr-1">
					<p class="text-xs text-muted-foreground">
						Os efeitos específicos desta ancestralidade serão exibidos aqui quando forem carregados
						pelo catálogo.
					</p>
				</div>
			</div>
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
					class="group flex w-full flex-col overflow-hidden rounded-md border bg-surface text-left transition-colors hover:border-primary-500 hover:bg-surface-raised {selectedAncestry?.id ===
					ancestry.id
						? 'border-primary-500 ring-1 ring-primary-500'
						: 'border-border'}"
					onclick={() => (selectedAncestry = ancestry)}
				>
					<div class="relative aspect-square w-full overflow-hidden bg-surface-raised">
						<img
							src={ancestry.image}
							alt=""
							class="absolute inset-0 size-full object-contain object-center p-2 opacity-80 transition-opacity group-hover:opacity-100"
						/>
					</div>
					<div class="flex flex-1 flex-col p-3">
						<div class="flex min-h-5 items-center justify-between gap-2">
							<h3 class="truncate text-sm font-semibold text-foreground">{ancestry.name}</h3>
							<span class="inline-flex size-4 shrink-0 items-center justify-center">
								{#if selectedAncestry?.id === ancestry.id}
									<Check size={15} class="text-primary-400" />
								{/if}
							</span>
						</div>
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

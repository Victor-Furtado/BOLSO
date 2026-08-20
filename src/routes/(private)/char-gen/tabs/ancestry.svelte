<script lang="ts">
	import { Check, Heart, Languages, Move, Sparkles, Swords } from 'lucide-svelte';
	import ancestries from '$lib/data/ancestries.json';
	import { ancestrySizeMap, ancestryVisionMap, getMappedValue } from '$lib/utils/map';

	type Ancestry = (typeof ancestries)[number];

	let selectedAncestry = $state<Ancestry>(ancestries[0]);
</script>

<div class="flex min-h-0 flex-col gap-6">
	<section
		class="flex min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface"
	>
		<div class="min-h-0 flex-1 overflow-y-auto">
			<div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
				<div class="p-6 sm:p-8">
					<div class="mb-6 flex items-start justify-between gap-4">
						<div>
							<p class="mb-2 text-xs font-semibold text-primary-400 uppercase">
								Ancestralidade selecionada
							</p>
							<h2 class="text-2xl font-semibold text-foreground">{selectedAncestry.name}</h2>
						</div>
						<div
							class="rounded-full border border-primary-500/30 bg-primary-950 p-3 text-primary-300"
						>
							<Check size={20} />
						</div>
					</div>

					<p class="max-w-3xl text-sm leading-6 text-muted-foreground">
						{selectedAncestry.description}
					</p>

					<div class="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<div class="rounded-md border border-border bg-surface-raised p-4">
							<div class="mb-2 flex items-center gap-2 text-primary-300">
								<Heart size={16} />
								<span class="text-xs font-medium uppercase">Vitalidade</span>
							</div>
							<p class="text-lg font-semibold text-foreground">{selectedAncestry.hp} PV</p>
						</div>
						<div class="rounded-md border border-border bg-surface-raised p-4">
							<div class="mb-2 flex items-center gap-2 text-primary-300">
								<Move size={16} />
								<span class="text-xs font-medium uppercase">Movimento</span>
							</div>
							<p class="text-lg font-semibold text-foreground">{selectedAncestry.speed} pés</p>
						</div>
						<div class="rounded-md border border-border bg-surface-raised p-4">
							<div class="mb-2 flex items-center gap-2 text-primary-300">
								<Swords size={16} />
								<span class="text-xs font-medium uppercase">Tamanho</span>
							</div>
							<p class="text-lg font-semibold text-foreground">
								{getMappedValue(ancestrySizeMap, selectedAncestry.size)}
							</p>
						</div>
						<div class="rounded-md border border-border bg-surface-raised p-4">
							<div class="mb-2 flex items-center gap-2 text-primary-300">
								<Sparkles size={16} />
								<span class="text-xs font-medium uppercase">Visão</span>
							</div>
							<p class="text-lg font-semibold text-foreground">
								{getMappedValue(ancestryVisionMap, selectedAncestry.vision)}
							</p>
						</div>
					</div>
				</div>

				<div
					class="relative min-h-56 overflow-hidden border-t border-border bg-surface-raised lg:border-t-0 lg:border-l"
				>
					<img
						src={selectedAncestry.img}
						alt={selectedAncestry.name}
						class="h-full min-h-56 w-full object-cover"
					/>
					<div
						class="absolute inset-x-0 bottom-0 bg-linear-to-t from-surface-raised to-transparent p-5 pt-14"
					>
						<div class="flex flex-wrap gap-2">
							{#each selectedAncestry.traits as trait (trait)}
								<span
									class="rounded-full border border-border bg-background/80 px-2.5 py-1 text-xs text-muted-foreground"
								>
									{trait}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="grid gap-6 border-t border-border p-6 sm:grid-cols-2 sm:p-8">
				<div>
					<h3 class="mb-3 text-sm font-semibold text-foreground">Aumentos e fraquezas</h3>
					<div class="flex flex-wrap gap-2">
						{#each selectedAncestry.boosts as boost (boost)}
							<span class="rounded-md bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
								>+{boost}</span
							>
						{/each}
						{#each selectedAncestry.flaws as flaw (flaw)}
							<span class="rounded-md bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger"
								>-{flaw}</span
							>
						{/each}
					</div>
				</div>
				<div>
					<div class="mb-3 flex items-center gap-2">
						<Languages size={16} class="text-primary-300" />
						<h3 class="text-sm font-semibold text-foreground">Idiomas</h3>
					</div>
					<p class="text-sm text-muted-foreground">{selectedAncestry.languages.join(', ')}</p>
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
					class="group overflow-hidden rounded-md border bg-surface text-left transition-colors hover:border-primary-500 hover:bg-surface-raised {selectedAncestry.id ===
					ancestry.id
						? 'border-primary-500 ring-1 ring-primary-500'
						: 'border-border'}"
					onclick={() => (selectedAncestry = ancestry)}
				>
					<img
						src={ancestry.img}
						alt=""
						class="aspect-4/3 w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
					/>
					<div class="p-3">
						<div class="flex items-center justify-between gap-2">
							<h3 class="truncate text-sm font-semibold text-foreground">{ancestry.name}</h3>
							{#if selectedAncestry.id === ancestry.id}
								<Check size={15} class="shrink-0 text-primary-400" />
							{/if}
						</div>
						<div class="mt-2 flex flex-wrap gap-1">
							{#each ancestry.boosts as boost (boost)}
								<span
									class="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success"
								>
									+{boost}
								</span>
							{/each}
							{#each ancestry.flaws as flaw (flaw)}
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

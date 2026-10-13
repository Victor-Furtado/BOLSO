<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { abilityLabels, type AncestryOption } from '$lib/char-gen/ancestry';
	import {
		ancestrySizeMap,
		ancestryVisionMap,
		creatureTraitMap,
		getLabel,
		languageMap
	} from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import { ArrowRight, Footprints, Heart, Languages, Ruler, Eye, Sparkles, X } from 'lucide-svelte';
	import FeaturePopover from './feature-popover.svelte';
	import RarityBadge from './rarity-badge.svelte';

	type Props = {
		ancestry: AncestryOption | null;
		open: boolean;
		selected?: boolean;
		onconfirm: () => void;
	};

	let { ancestry, open = $bindable(false), selected = false, onconfirm }: Props = $props();

	const stats = $derived(
		ancestry
			? [
					{ label: 'Pontos de vida', value: `${ancestry.hp} PV`, icon: Heart },
					{ label: 'Tamanho', value: getLabel(ancestrySizeMap, ancestry.size), icon: Ruler },
					{ label: 'Deslocamento', value: `${ancestry.speed} pés`, icon: Footprints },
					{
						label: 'Visão',
						value:
							ancestry.vision === 'normal'
								? 'Visão normal'
								: getLabel(ancestryVisionMap, ancestry.vision),
						icon: Eye
					}
				]
			: []
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
		/>
		<Dialog.Content
			class="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border-strong bg-surface shadow-2xl shadow-black outline-none data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in motion-reduce:animate-none sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[86dvh] sm:w-[min(44rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border-b sm:data-[state=closed]:animate-dialog-out sm:data-[state=open]:animate-dialog-in"
		>
			{#if ancestry}
				<div class="relative overflow-y-auto overscroll-contain">
					<div class="relative overflow-hidden border-b border-gold-800/60">
						<img
							src={ancestry.image}
							alt=""
							aria-hidden="true"
							class="absolute inset-0 size-full scale-125 object-cover opacity-30 blur-2xl"
						/>
						<div
							aria-hidden="true"
							class="absolute inset-0 bg-linear-to-b from-primary-950/40 via-surface/70 to-surface"
						></div>

						<div
							aria-hidden="true"
							class="relative mx-auto mt-2.5 h-1 w-10 rounded-full bg-border-strong sm:hidden"
						></div>

						<div class="relative flex items-end gap-4 px-5 pt-5 pb-5 sm:gap-6 sm:px-7 sm:pt-7">
							<div
								class="relative size-24 shrink-0 border border-gold-500 bg-linear-to-br from-gold-600 via-gold-800 to-gold-700 p-1 shadow-xl shadow-black/60 sm:size-32"
							>
								<img
									src={ancestry.image}
									alt="Retrato de {ancestry.name}"
									width="256"
									height="256"
									class="size-full border border-black/60 object-cover"
								/>
							</div>
							<div class="min-w-0 pb-1">
								<div class="mb-2 flex flex-wrap items-center gap-1.5">
									<RarityBadge rarity={ancestry.rarity} />
									{#if ancestry.legacy}
										<span
											class="rounded-sm border border-border-strong bg-background/70 px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-muted-foreground uppercase"
											title="Regras anteriores ao Remaster"
										>
											Legado
										</span>
									{/if}
									{#each ancestry.traits as trait (trait)}
										<span
											class="rounded-sm border border-gold-800 px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-gold-300 uppercase"
										>
											{getLabel(creatureTraitMap, trait)}
										</span>
									{/each}
								</div>
								<Dialog.Title
									class="font-heading text-3xl leading-none font-bold text-gold-100 sm:text-4xl"
								>
									{ancestry.name}
								</Dialog.Title>
								<p class="mt-1.5 text-sm text-muted-foreground">
									{ancestry.heritageIds.length}
									{ancestry.heritageIds.length === 1
										? 'herança disponível'
										: 'heranças disponíveis'}
								</p>
							</div>
						</div>
					</div>

					<div class="flex flex-col gap-7 px-5 py-6 sm:px-7">
						{#if ancestry.description}
							<Dialog.Description
								class="font-heading text-base leading-relaxed text-foreground/90 first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-logo first-letter:text-5xl first-letter:leading-none first-letter:text-gold-300"
							>
								{ancestry.description}
							</Dialog.Description>
						{/if}

						<dl class="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border/70 py-3">
							{#each stats as stat (stat.label)}
								<div class="flex items-center gap-1.5" title={stat.label}>
									<stat.icon class="size-4 text-gold-500" aria-hidden="true" />
									<dt class="sr-only">{stat.label}</dt>
									<dd class="font-heading text-base leading-none text-gold-100">{stat.value}</dd>
								</div>
							{/each}
						</dl>

						<section aria-labelledby="dossier-abilities" class="flex flex-col gap-3">
							<h3
								id="dossier-abilities"
								class="text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase"
							>
								Atributos
							</h3>
							<div class="flex flex-wrap gap-1.5">
								{#each ancestry.boosts as boost, index (index)}
									<span
										class={cn(
											'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm font-medium',
											boost === 'FREE'
												? 'border-dashed border-gold-600 text-gold-200'
												: 'border-gold-600 bg-gold-800/40 text-gold-100'
										)}
									>
										<span aria-hidden="true" class="text-gold-400">+</span>
										<span class="sr-only">Aumento de</span>
										{abilityLabels[boost].full}
									</span>
								{/each}
								{#each ancestry.flaws as flaw, index (index)}
									<span
										class="inline-flex items-center gap-1 rounded-md border border-primary-700 bg-primary-950/60 px-2.5 py-1 text-sm font-medium text-primary-200"
									>
										<span aria-hidden="true" class="text-primary-400">−</span>
										<span class="sr-only">Falha em</span>
										{abilityLabels[flaw].full}
									</span>
								{/each}
							</div>
						</section>

						<section aria-labelledby="dossier-languages" class="flex flex-col gap-2">
							<h3
								id="dossier-languages"
								class="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase"
							>
								<Languages class="size-3.5" aria-hidden="true" />
								Idiomas
							</h3>
							<p class="text-foreground">
								{ancestry.languages.map((language) => getLabel(languageMap, language)).join(', ')}
							</p>
							{#if ancestry.additionalLanguages.length}
								<p class="text-sm text-muted-foreground">
									<span class="text-subtle-foreground">Adicionais, conforme sua Inteligência:</span>
									{ancestry.additionalLanguages
										.map((language) => getLabel(languageMap, language))
										.join(', ')}
								</p>
							{/if}
						</section>

						{#if ancestry.features.length}
							<section aria-labelledby="dossier-features" class="flex flex-col gap-2">
								<h3
									id="dossier-features"
									class="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase"
								>
									<Sparkles class="size-3.5" aria-hidden="true" />
									Habilidades de ancestralidade
								</h3>
								<ul class="flex flex-wrap gap-1.5">
									{#each ancestry.features as feature (feature.name)}
										<li>
											<FeaturePopover
												{feature}
												class="inline-flex rounded-md border border-border-strong bg-surface-raised px-2.5 py-1 text-sm text-foreground transition-colors hover:border-gold-700 data-[state=delayed-open]:border-gold-600 data-[state=instant-open]:border-gold-600"
											/>
										</li>
									{/each}
								</ul>
							</section>
						{/if}
					</div>
				</div>

				<div
					class="flex gap-2 border-t border-border bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-7"
				>
					<Dialog.Close
						class="inline-flex items-center justify-center gap-2 rounded-md border border-border-strong px-4 py-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
					>
						Voltar
					</Dialog.Close>
					<button
						type="button"
						onclick={onconfirm}
						class="group inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-5 py-3 font-heading text-base font-semibold text-primary-foreground shadow-lg shadow-primary-950/60 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
					>
						{selected ? 'Continuar' : 'Escolher'}
						{ancestry.name}
						<ArrowRight
							class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
						/>
					</button>
				</div>

				<Dialog.Close
					class="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-background/60 text-muted-foreground backdrop-blur transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
				>
					<X class="size-4" />
					<span class="sr-only">Fechar</span>
				</Dialog.Close>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

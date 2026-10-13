<script lang="ts">
	import { Pagination, RadioGroup } from 'bits-ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { abilityLabels, rarityOrder, type Ability, type Rarity } from '$lib/char-gen/ancestry';
	import {
		backgroundRarityLabels,
		offersBoost,
		type BackgroundCatalog,
		type BackgroundChoice
	} from '$lib/char-gen/background';
	import { inputClass } from '$lib/components/ui/form-field.svelte';
	import { getLabel, skillMap } from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import { ArrowRight, Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-svelte';
	import BackgroundBoosts from './background-boosts.svelte';
	import BackgroundCard from './background-card.svelte';

	type Props = {
		catalog: BackgroundCatalog;
		value: BackgroundChoice;
		characterName?: string;
		onnext?: () => void;
	};

	let { catalog, value = $bindable(), characterName = '', onnext }: Props = $props();

	const PAGE_SIZE = 24;
	const abilities: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
	const gemClasses: Record<Rarity, string> = {
		common: 'bg-gold-400',
		uncommon: 'bg-rarity-uncommon',
		rare: 'bg-rarity-rare',
		unique: 'bg-rarity-unique'
	};

	const pageButtonClass =
		'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-input px-2.5 text-sm font-semibold text-muted-foreground tabular-nums transition-colors outline-none hover:border-border-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 data-selected:border-gold-400 data-selected:bg-gold-800/50 data-selected:text-gold-100 sm:h-10 sm:min-w-10';

	const id = $props.id();

	const wide = new MediaQuery('min-width: 640px', true);
	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);

	let query = $state('');
	let ability = $state<Ability | null>(null);
	let page = $state(1);
	let listTop = $state<HTMLElement | null>(null);

	const normalize = (text: string) =>
		text
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase();

	const searchIndex = $derived(
		catalog.backgrounds.map((background) => ({
			background,
			text: normalize(
				[
					background.name,
					background.originDetail ?? '',
					background.prerequisite ?? '',
					...background.skills.map((skill) => getLabel(skillMap, skill)),
					...background.lore,
					...background.grants.map((grant) => grant.name)
				].join(' ')
			)
		}))
	);

	const results = $derived.by(() => {
		const terms = normalize(query).split(/\s+/).filter(Boolean);
		return searchIndex
			.filter(
				({ background, text }) =>
					(!ability || offersBoost(background, ability)) &&
					terms.every((term) => text.includes(term))
			)
			.map(({ background }) => background);
	});

	const groups = $derived.by(() => {
		const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
		return rarityOrder
			.map((rarity) => ({
				rarity,
				total: results.filter((b) => b.rarity === rarity).length,
				items: visible.filter((b) => b.rarity === rarity)
			}))
			.filter((group) => group.items.length > 0);
	});

	const filtered = $derived(query.trim() !== '' || ability !== null);
	const selected = $derived(
		catalog.backgrounds.find((background) => background.id === value.backgroundId) ?? null
	);
	const heroName = $derived(characterName.trim());

	function setQuery(next: string) {
		query = next;
		page = 1;
	}

	function toggleAbility(next: Ability) {
		ability = ability === next ? null : next;
		page = 1;
	}

	function clearFilters() {
		query = '';
		ability = null;
		page = 1;
	}

	function setPage(next: number) {
		page = next;
		if (listTop && listTop.getBoundingClientRect().top < 0) {
			listTop.scrollIntoView({ behavior: reducedMotion.current ? 'auto' : 'smooth' });
		}
	}
</script>

<div class="flex flex-col gap-8">
	{#if selected}
		<div
			role="status"
			class="flex animate-page-in flex-col gap-4 rounded-lg border border-gold-600/60 bg-linear-to-r from-primary-950/70 via-surface-raised to-surface-raised p-4 motion-reduce:animate-none sm:flex-row sm:items-center"
		>
			<div class="flex min-w-0 flex-1 items-start gap-4">
				<span
					aria-hidden="true"
					class="mt-1 flex size-10 shrink-0 rotate-45 items-center justify-center border border-gold-300 bg-primary-700 shadow-lg shadow-primary-900/60"
				>
					<Check class="size-5 -rotate-45 text-gold-100" strokeWidth={3} />
				</span>
				<div class="flex min-w-0 flex-col gap-2">
					<div>
						<p class="text-[0.7rem] font-semibold tracking-[0.2em] text-gold-400 uppercase">
							Antecedente escolhido
						</p>
						<p class="font-heading text-lg leading-tight text-gold-100">
							{heroName ? `${heroName}: ` : ''}{selected.name}
						</p>
					</div>
					<BackgroundBoosts boosts={selected.boosts} size="md" />
					{#if selected.skills.length || selected.lore.length || selected.grants.length}
						<p class="text-sm text-muted-foreground">
							{[
								...selected.skills.map((skill) => getLabel(skillMap, skill)),
								...selected.lore,
								...selected.grants.map((grant) => grant.name)
							].join(' · ')}
						</p>
					{/if}
				</div>
			</div>
			{#if onnext}
				<button
					type="button"
					onclick={onnext}
					class="group inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-5 py-3 font-heading text-base font-semibold text-primary-foreground shadow-lg shadow-primary-950/60 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px"
				>
					Próximo: Classe
					<ArrowRight
						class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
					/>
				</button>
			{/if}
		</div>
	{/if}

	<div class="flex flex-col gap-4 lg:flex-row lg:items-end">
		<div class="flex min-w-0 flex-1 flex-col gap-1.5">
			<label for="{id}-search" class="text-sm font-medium text-muted-foreground">
				Buscar antecedente
			</label>
			<div class="relative">
				<Search
					class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground"
					aria-hidden="true"
				/>
				<input
					id="{id}-search"
					type="search"
					autocomplete="off"
					placeholder="Nome, perícia, talento ou região…"
					bind:value={() => query, setQuery}
					class={cn(inputClass, 'pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden')}
				/>
				{#if query}
					<button
						type="button"
						aria-label="Limpar busca"
						onclick={() => setQuery('')}
						class="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
					>
						<X class="size-4" />
					</button>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<span id="{id}-ability" class="text-sm font-medium text-muted-foreground"> Aumento em </span>
			<div role="group" aria-labelledby="{id}-ability" class="grid grid-cols-6 gap-1.5">
				{#each abilities as option (option)}
					<button
						type="button"
						aria-pressed={ability === option}
						title={abilityLabels[option].full}
						onclick={() => toggleAbility(option)}
						class="h-11 rounded-md border border-border bg-input px-2.5 text-sm font-semibold text-muted-foreground transition-colors outline-none hover:border-border-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-gold-400 aria-pressed:bg-gold-800/50 aria-pressed:text-gold-100 lg:min-w-12"
					>
						<span aria-hidden="true">{abilityLabels[option].short}</span>
						<span class="sr-only">{abilityLabels[option].full}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<p
		bind:this={listTop}
		aria-live="polite"
		class="-mt-4 scroll-mt-24 text-sm text-subtle-foreground tabular-nums"
	>
		{results.length}
		{results.length === 1 ? 'antecedente' : 'antecedentes'}
		{#if filtered}
			·
			<button
				type="button"
				onclick={clearFilters}
				class="rounded-sm text-gold-300 underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
			>
				limpar filtros
			</button>
		{/if}
	</p>

	{#if results.length}
		<RadioGroup.Root
			bind:value={() => value.backgroundId ?? '', (next) => (value.backgroundId = next || null)}
			aria-label="Antecedente"
			class="flex flex-col gap-8"
		>
			{#each groups as group (group.rarity)}
				<section aria-labelledby="{id}-{group.rarity}">
					<h2 id="{id}-{group.rarity}" class="mb-4 flex items-center gap-3">
						<span
							aria-hidden="true"
							class={cn(
								'size-2 shrink-0 rotate-45 shadow-sm shadow-black',
								gemClasses[group.rarity]
							)}
						></span>
						<span
							class="font-heading text-sm font-semibold tracking-[0.2em] text-gold-300 uppercase"
						>
							{backgroundRarityLabels[group.rarity].plural}
						</span>
						<span class="text-xs text-subtle-foreground tabular-nums">{group.total}</span>
						<span
							aria-hidden="true"
							class="h-px flex-1 bg-linear-to-r from-gold-700/80 to-transparent"
						></span>
					</h2>
					<div class="grid gap-3 lg:grid-cols-2 lg:gap-4">
						{#each group.items as background, index (background.id)}
							<BackgroundCard {background} {index} />
						{/each}
					</div>
				</section>
			{/each}
		</RadioGroup.Root>

		{#if results.length > PAGE_SIZE}
			<nav aria-label="Páginas de antecedentes">
				<Pagination.Root
					count={results.length}
					perPage={PAGE_SIZE}
					siblingCount={wide.current ? 1 : 0}
					bind:page={() => page, setPage}
					class="flex flex-col items-center gap-3"
				>
					{#snippet children({ pages, range, currentPage })}
						<div class="flex items-center gap-1 sm:gap-1.5">
							<Pagination.PrevButton class={cn(pageButtonClass, 'px-2')}>
								<ChevronLeft class="size-4" aria-hidden="true" />
								<span class="sr-only">Página anterior</span>
							</Pagination.PrevButton>
							{#each pages as item (item.key)}
								{#if item.type === 'ellipsis'}
									<span
										aria-hidden="true"
										class="w-6 text-center text-subtle-foreground select-none"
									>
										…
									</span>
								{:else}
									<Pagination.Page page={item}>
										{#snippet child({ props })}
											<button
												{...props}
												aria-label="Página {item.value}"
												aria-current={item.value === currentPage ? 'page' : undefined}
												class={pageButtonClass}
											>
												{item.value}
											</button>
										{/snippet}
									</Pagination.Page>
								{/if}
							{/each}
							<Pagination.NextButton class={cn(pageButtonClass, 'px-2')}>
								<ChevronRight class="size-4" aria-hidden="true" />
								<span class="sr-only">Próxima página</span>
							</Pagination.NextButton>
						</div>
						<p class="text-xs text-subtle-foreground tabular-nums">
							Mostrando {range.start}–{range.end} de {results.length}
						</p>
					{/snippet}
				</Pagination.Root>
			</nav>
		{/if}
	{:else}
		<div
			class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-10 text-center"
		>
			<p class="font-heading text-lg text-gold-100">Nenhum antecedente encontrado</p>
			<p class="text-sm text-muted-foreground">Tente outro termo ou remova o filtro de atributo.</p>
			<button
				type="button"
				onclick={clearFilters}
				class="mt-1 rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring"
			>
				Limpar filtros
			</button>
		</div>
	{/if}
</div>

<script lang="ts">
	import { tick } from 'svelte';
	import type { AncestryCatalog, AncestryChoice, HeritageOption } from '$lib/char-gen/ancestry';
	import { cn } from '$lib/utils/ui';
	import { ArrowLeft, ArrowRight, Check } from 'lucide-svelte';
	import AncestryPicker from './ancestry-picker.svelte';
	import AncestryPills from './ancestry-pills.svelte';
	import HeritagePicker from './heritage-picker.svelte';

	type Props = {
		catalog: AncestryCatalog;
		value: AncestryChoice;
		characterName?: string;
		onnext?: () => void;
	};

	let { catalog, value = $bindable(), characterName = '', onnext }: Props = $props();

	type Step = 'ancestry' | 'heritage';
	let step = $state<Step>(value.ancestryId ? 'heritage' : 'ancestry');
	let container = $state<HTMLElement>();

	const heritagesById = $derived(new Map(catalog.heritages.map((h) => [h.id, h])));
	const ancestry = $derived(catalog.ancestries.find((a) => a.id === value.ancestryId) ?? null);
	const heritages = $derived(
		(ancestry?.heritageIds ?? [])
			.map((heritageId) => heritagesById.get(heritageId))
			.filter((h): h is HeritageOption => h !== undefined)
	);
	const heritage = $derived(
		value.heritageId ? (heritagesById.get(value.heritageId) ?? null) : null
	);
	const heroName = $derived(characterName.trim());

	const steps = $derived([
		{ key: 'ancestry' as const, number: 1, label: 'Ancestralidade', choice: ancestry?.name },
		{ key: 'heritage' as const, number: 2, label: 'Herança', choice: heritage?.name }
	]);

	async function goTo(next: Step) {
		step = next;
		await tick();
		if (container && container.getBoundingClientRect().top < 0) {
			container.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function selectAncestry(ancestryId: string) {
		if (ancestryId !== value.ancestryId) {
			const next = catalog.ancestries.find((a) => a.id === ancestryId);
			const keepsHeritage = value.heritageId && next?.heritageIds.includes(value.heritageId);
			value.ancestryId = ancestryId;
			if (!keepsHeritage) value.heritageId = null;
		}
		goTo('heritage');
	}
</script>

<div bind:this={container} class="flex scroll-mt-24 flex-col gap-8">
	<nav aria-label="Etapas da ancestralidade">
		<ol class="flex items-center gap-3">
			{#each steps as item, index (item.key)}
				{@const active = step === item.key}
				{@const done = Boolean(item.choice)}
				{@const disabled = item.key === 'heritage' && !ancestry}
				<li class={cn('flex min-w-0 items-center gap-3', index === 0 && 'flex-1')}>
					<button
						type="button"
						{disabled}
						aria-current={active ? 'step' : undefined}
						onclick={() => goTo(item.key)}
						class="group flex min-w-0 items-center gap-3 rounded-md py-1 pr-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span
							aria-hidden="true"
							class={cn(
								'flex size-8 shrink-0 rotate-45 items-center justify-center border transition-colors duration-200',
								active
									? 'border-gold-300 bg-primary-700 shadow-lg shadow-primary-900/60'
									: done
										? 'border-gold-600 bg-gold-900/60'
										: 'border-border-strong bg-background'
							)}
						>
							<span class="-rotate-45 font-logo text-xs font-bold text-gold-100">
								{#if done && !active}
									<Check class="size-4 text-gold-300" strokeWidth={3} />
								{:else}
									{item.number}
								{/if}
							</span>
						</span>
						<span class="min-w-0">
							<span
								class="block text-[0.7rem] font-semibold tracking-[0.2em] text-subtle-foreground uppercase"
							>
								{item.label}
							</span>
							<span
								class={cn(
									'block truncate font-heading text-base leading-tight',
									item.choice ? 'text-gold-100' : 'text-muted-foreground italic'
								)}
							>
								{item.choice ?? 'A escolher'}
							</span>
						</span>
					</button>
					{#if index === 0}
						<span
							aria-hidden="true"
							class={cn(
								'h-px min-w-6 flex-1 transition-colors duration-300',
								ancestry
									? 'bg-linear-to-r from-gold-500 to-gold-800'
									: 'bg-linear-to-r from-border-strong to-border'
							)}
						></span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>

	{#if step === 'ancestry' || !ancestry}
		<AncestryPicker
			ancestries={catalog.ancestries}
			selectedId={value.ancestryId}
			onselect={selectAncestry}
		/>
	{:else}
		<div class="flex flex-col gap-8">
			<div
				class="relative grid animate-page-in grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 overflow-hidden rounded-lg border border-gold-800 bg-surface-raised/70 p-3 pr-4 motion-reduce:animate-none sm:gap-y-2 sm:p-4"
			>
				<img
					src={ancestry.image}
					alt=""
					aria-hidden="true"
					class="absolute inset-y-0 right-0 h-full w-1/2 mask-l-from-0% mask-l-to-100% object-cover opacity-15"
				/>
				<img
					src={ancestry.image}
					alt=""
					width="256"
					height="256"
					class="relative size-16 shrink-0 border border-gold-600 object-cover shadow-lg shadow-black/50 sm:row-span-2 sm:size-24"
				/>
				<div class="relative min-w-0 sm:self-end">
					<p class="text-[0.7rem] font-semibold tracking-[0.2em] text-subtle-foreground uppercase">
						Ancestralidade
					</p>
					<p class="truncate font-heading text-xl leading-tight font-semibold text-gold-100">
						{ancestry.name}
					</p>
				</div>
				<AncestryPills
					{ancestry}
					size="md"
					class="relative col-span-3 row-start-2 self-start sm:col-span-1 sm:col-start-2"
				/>
				<button
					type="button"
					onclick={() => goTo('ancestry')}
					class="relative col-start-3 row-start-1 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border-strong bg-surface/80 px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring sm:row-span-2"
				>
					<ArrowLeft class="size-4" />
					Trocar
				</button>
			</div>

			<div>
				<h2 class="font-heading text-2xl font-semibold text-gold-100">
					Que herança corre no sangue {heroName ? `de ${heroName}` : 'do seu herói'}?
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					A herança refina sua ancestralidade com um traço de família, ambiente ou magia.
				</p>
			</div>

			{#if heritages.length}
				<HeritagePicker
					{heritages}
					bind:value={value.heritageId}
					label="Herança de {ancestry.name}"
					fallbackImage={ancestry.image}
				/>
			{:else}
				<p
					class="rounded-lg border border-dashed border-border-strong p-6 text-center text-muted-foreground"
				>
					Nenhuma herança cadastrada para {ancestry.name} ainda.
				</p>
			{/if}

			{#if heritage}
				<div
					role="status"
					class="flex animate-page-in flex-col gap-4 rounded-lg border border-gold-600/60 bg-linear-to-r from-primary-950/70 via-surface-raised to-surface-raised p-4 motion-reduce:animate-none sm:flex-row sm:items-center"
				>
					<div class="flex min-w-0 flex-1 items-center gap-4">
						<span
							aria-hidden="true"
							class="flex size-10 shrink-0 rotate-45 items-center justify-center border border-gold-300 bg-primary-700 shadow-lg shadow-primary-900/60"
						>
							<Check class="size-5 -rotate-45 text-gold-100" strokeWidth={3} />
						</span>
						<div class="min-w-0">
							<p class="text-[0.7rem] font-semibold tracking-[0.2em] text-gold-400 uppercase">
								Linhagem definida
							</p>
							<p class="font-heading text-lg leading-tight text-gold-100">
								{heroName ? `${heroName}: ` : ''}{ancestry.name} · {heritage.name}
							</p>
						</div>
					</div>
					{#if onnext}
						<button
							type="button"
							onclick={onnext}
							class="group inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-5 py-3 font-heading text-base font-semibold text-primary-foreground shadow-lg shadow-primary-950/60 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px"
						>
							Próximo: Antecedente
							<ArrowRight
								class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
							/>
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

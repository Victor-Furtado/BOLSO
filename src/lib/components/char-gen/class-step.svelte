<script lang="ts">
	import { abilityLabels, rarityOrder, type Rarity } from '$lib/char-gen/ancestry';
	import { classRarityLabels, type ClassCatalog, type ClassChoice } from '$lib/char-gen/class';
	import { cn } from '$lib/utils/ui';
	import { ArrowRight, Check, Info } from 'lucide-svelte';
	import ClassCard from './class-card.svelte';
	import ClassDossier from './class-dossier.svelte';

	type Props = {
		catalog: ClassCatalog;
		value: ClassChoice;
		characterName?: string;
		onnext?: () => void;
	};

	let { catalog, value = $bindable(), characterName = '', onnext }: Props = $props();

	const id = $props.id();

	const gemClasses: Record<Rarity, string> = {
		common: 'bg-gold-400',
		uncommon: 'bg-rarity-uncommon',
		rare: 'bg-rarity-rare',
		unique: 'bg-rarity-unique'
	};

	let inspectedId = $state<string | null>(null);
	let dossierOpen = $state(false);

	const groups = $derived(
		rarityOrder
			.map((rarity) => ({ rarity, items: catalog.classes.filter((c) => c.rarity === rarity) }))
			.filter((group) => group.items.length > 0)
	);
	const inspected = $derived(catalog.classes.find((c) => c.id === inspectedId) ?? null);
	const selected = $derived(catalog.classes.find((c) => c.id === value.classId) ?? null);
	const heroName = $derived(characterName.trim());

	function inspect(classId: string) {
		inspectedId = classId;
		dossierOpen = true;
	}

	function confirm() {
		if (inspectedId) value.classId = inspectedId;
		dossierOpen = false;
	}
</script>

<div class="flex flex-col gap-8">
	{#if selected}
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
				<img
					src={selected.image}
					alt=""
					width="256"
					height="245"
					class="size-12 shrink-0 object-contain drop-shadow-[0_4px_6px_rgb(0_0_0/0.6)]"
				/>
				<div class="min-w-0">
					<p class="text-[0.7rem] font-semibold tracking-[0.2em] text-gold-400 uppercase">
						Classe escolhida
					</p>
					<p class="font-heading text-lg leading-tight text-gold-100">
						{heroName ? `${heroName}: ` : ''}{selected.name}
					</p>
					<p class="text-sm text-muted-foreground">
						{selected.hp} PV + Con por nível ·
						{selected.keyAbilities.length
							? selected.keyAbilities.map((ability) => abilityLabels[ability].full).join(' ou ')
							: 'Atributo-chave pela subclasse'}
					</p>
				</div>
			</div>
			<button
				type="button"
				onclick={() => inspect(selected.id)}
				class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-border-strong bg-surface/80 px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Info class="size-4" />
				Ver detalhes
			</button>
			{#if onnext}
				<button
					type="button"
					onclick={onnext}
					class="group inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-5 py-3 font-heading text-base font-semibold text-primary-foreground shadow-lg shadow-primary-950/60 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px"
				>
					Próximo: Toques finais
					<ArrowRight
						class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
					/>
				</button>
			{/if}
		</div>
	{/if}

	{#each groups as group, groupIndex (group.rarity)}
		<section
			aria-labelledby="{id}-{group.rarity}"
			class="animate-page-in motion-reduce:animate-none"
			style:animation-delay="{groupIndex * 70}ms"
		>
			<h2 id="{id}-{group.rarity}" class="mb-4 flex items-center gap-3">
				<span
					aria-hidden="true"
					class={cn('size-2 shrink-0 rotate-45 shadow-sm shadow-black', gemClasses[group.rarity])}
				></span>
				<span class="font-heading text-sm font-semibold tracking-[0.2em] text-gold-300 uppercase">
					{classRarityLabels[group.rarity].plural}
				</span>
				<span class="text-xs text-subtle-foreground tabular-nums">{group.items.length}</span>
				<span aria-hidden="true" class="h-px flex-1 bg-linear-to-r from-gold-700/80 to-transparent"
				></span>
			</h2>

			<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
				{#each group.items as option (option.id)}
					<li>
						<ClassCard
							{option}
							selected={option.id === value.classId}
							onclick={() => inspect(option.id)}
						/>
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<p
			class="rounded-lg border border-dashed border-border-strong p-6 text-center text-muted-foreground"
		>
			Nenhuma classe cadastrada ainda.
		</p>
	{/each}
</div>

<ClassDossier
	option={inspected}
	bind:open={dossierOpen}
	selected={inspectedId === value.classId}
	onconfirm={confirm}
/>

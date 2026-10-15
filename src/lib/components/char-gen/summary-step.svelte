<script lang="ts">
	import { abilityLabels } from '$lib/char-gen/ancestry';
	import type { BasicInfo } from '$lib/char-gen/basic-info';
	import {
		computeBuild,
		formatModifier,
		proficiencyBonus,
		type FinalTouches,
		type Selections
	} from '$lib/char-gen/build';
	import { proficiencyLabels, type ProficiencyRank } from '$lib/char-gen/class';
	import { featCategoryLabels, type FeatOption } from '$lib/char-gen/feat';
	import { enhance } from '$app/forms';
	import { characterFileName, toCharacterExport } from '$lib/char-gen/export';
	import SubmitButton from '$lib/components/ui/submit-button.svelte';
	import {
		ancestrySizeMap,
		ancestryVisionMap,
		classAttackMap,
		getLabel,
		languageMap,
		skillMap
	} from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import {
		CircleAlert,
		Download,
		Save,
		Eye,
		Footprints,
		Heart,
		Ruler,
		Shield,
		Sparkles,
		UserRound,
		Weight
	} from 'lucide-svelte';
	import AttributePanel from './attribute-panel.svelte';
	import FeaturePopover from './feature-popover.svelte';

	type TabTarget = 'basic-info' | 'ancestries' | 'background' | 'class' | 'final-touches';

	type Props = {
		basicInfo: BasicInfo;
		selections: Selections;
		feats: FeatOption[];
		touches: FinalTouches;
		atLimit: boolean;
		ongoto: (tab: TabTarget) => void;
	};

	let { basicInfo, selections, feats, touches, atLimit, ongoto }: Props = $props();
	let saving = $state(false);

	const id = $props.id();

	const build = $derived(computeBuild(selections, touches, feats));
	const ancestry = $derived(selections.ancestry);
	const heritage = $derived(selections.heritage);
	const background = $derived(selections.background);
	const classOption = $derived(selections.classOption);
	const name = $derived(basicInfo.name.trim());

	function downloadJson() {
		const json = JSON.stringify(toCharacterExport(basicInfo, selections, build), null, 2);
		const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = characterFileName(name);
		link.click();
		URL.revokeObjectURL(url);
	}

	const pending = $derived(
		[
			!name && { label: 'Dar um nome ao personagem', tab: 'basic-info' as const },
			!ancestry && { label: 'Escolher a ancestralidade', tab: 'ancestries' as const },
			ancestry && !heritage && { label: 'Escolher a herança', tab: 'ancestries' as const },
			!background && { label: 'Escolher o antecedente', tab: 'background' as const },
			!classOption && { label: 'Escolher a classe', tab: 'class' as const },
			ancestry &&
				background &&
				classOption &&
				!build.boostsDone && {
					label: 'Distribuir os aumentos de atributo',
					tab: 'final-touches' as const
				},
			classOption &&
				build.skillPicks.chosen.length < build.skillPicks.count && {
					label: `Escolher ${build.skillPicks.count - build.skillPicks.chosen.length} perícia(s) treinada(s)`,
					tab: 'final-touches' as const
				},
			...build.featSlots
				.filter((slot) => !slot.chosen)
				.map((slot) => ({
					label: `Escolher ${featCategoryLabels[slot.category].toLowerCase()}`,
					tab: 'final-touches' as const
				}))
		].filter((item) => !!item)
	);

	const subtitle = $derived(
		[
			ancestry ? (heritage ? `${ancestry.name} (${heritage.name})` : ancestry.name) : null,
			background?.name,
			classOption ? `${classOption.name} 1` : null
		]
			.filter(Boolean)
			.join(' · ')
	);

	const defenses = $derived(
		build.stats && classOption
			? [
					{ label: 'Fortitude', value: build.stats.fortitude, rank: classOption.saves.fortitude },
					{ label: 'Reflexos', value: build.stats.reflex, rank: classOption.saves.reflex },
					{ label: 'Vontade', value: build.stats.will, rank: classOption.saves.will },
					{ label: 'Percepção', value: build.stats.perception, rank: classOption.perception }
				]
			: []
	);

	const proficiencies = $derived(
		classOption
			? [
					{ label: 'Armas simples', rank: classOption.attacks.simple },
					{ label: 'Armas marciais', rank: classOption.attacks.martial },
					{ label: 'Armas avançadas', rank: classOption.attacks.advanced },
					{ label: 'Desarmado', rank: classOption.attacks.unarmed },
					...(classOption.attacks.other
						? [
								{
									label: getLabel(classAttackMap, classOption.attacks.other.name),
									rank: classOption.attacks.other.rank
								}
							]
						: []),
					{ label: 'Sem armadura', rank: classOption.defenses.unarmored },
					{ label: 'Armadura leve', rank: classOption.defenses.light },
					{ label: 'Armadura média', rank: classOption.defenses.medium },
					{ label: 'Armadura pesada', rank: classOption.defenses.heavy }
				].filter((row) => row.rank > 0)
			: []
	);

	const languages = $derived(
		[...build.languages.fixed, ...build.languages.chosen].map((language) =>
			getLabel(languageMap, language)
		)
	);

	const details = $derived(
		[
			{ label: 'Ofício anterior', value: basicInfo.formerOccupation },
			{ label: 'Idade', value: basicInfo.age ? `${basicInfo.age} anos` : '' },
			{ label: 'Altura', value: basicInfo.heightCm ? `${basicInfo.heightCm} cm` : '' },
			{ label: 'Peso', value: basicInfo.weightKg ? `${basicInfo.weightKg} kg` : '' }
		].filter((row) => row.value.trim())
	);
</script>

{#snippet sectionTitle(title: string, sectionId: string)}
	<h2
		id={sectionId}
		class="mb-3 flex items-center gap-3 font-heading text-sm font-semibold tracking-[0.2em] text-gold-300 uppercase"
	>
		<span aria-hidden="true" class="size-1.5 shrink-0 rotate-45 bg-gold-400"></span>
		{title}
		<span aria-hidden="true" class="h-px flex-1 bg-linear-to-r from-gold-700/80 to-transparent"
		></span>
	</h2>
{/snippet}

{#snippet rankTag(rank: ProficiencyRank)}
	<span
		class="text-[0.65rem] font-semibold tracking-wider text-subtle-foreground uppercase"
		title={proficiencyLabels[rank]}
	>
		{proficiencyLabels[rank]}
	</span>
{/snippet}

<div class="flex flex-col gap-8">
	{#if pending.length}
		<div
			role="status"
			class="flex animate-page-in flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 motion-reduce:animate-none"
		>
			<p class="flex items-center gap-2 font-heading text-base text-gold-100">
				<CircleAlert class="size-5 text-warning" aria-hidden="true" />
				Ainda falta{pending.length === 1 ? '' : 'm'}
				{pending.length}
				{pending.length === 1 ? 'passo' : 'passos'}
			</p>
			<ul class="flex flex-wrap gap-2">
				{#each pending as item (item.label)}
					<li>
						<button
							type="button"
							onclick={() => ongoto(item.tab)}
							class="rounded-md border border-border-strong bg-surface/80 px-3 py-1.5 text-sm text-foreground transition-colors outline-none hover:border-gold-700 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring"
						>
							{item.label}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<header
		class="relative flex animate-page-in flex-col gap-5 overflow-hidden rounded-lg border border-gold-800 bg-radial-[at_0%_0%] from-primary-900/50 via-surface-raised to-surface-raised p-5 motion-reduce:animate-none sm:flex-row sm:items-center sm:p-6"
	>
		{#if classOption}
			<img
				src={classOption.image}
				alt=""
				aria-hidden="true"
				class="pointer-events-none absolute -right-6 -bottom-8 size-44 object-contain opacity-10"
			/>
		{/if}
		<div
			class="relative size-24 shrink-0 border border-gold-500 bg-linear-to-br from-gold-600 via-gold-800 to-gold-700 p-1 shadow-xl shadow-black/60 sm:size-28"
		>
			{#if basicInfo.portrait}
				<img
					src={basicInfo.portrait.dataUrl}
					alt="Retrato de {name || 'seu personagem'}"
					class="size-full border border-black/60 object-cover"
				/>
			{:else}
				<span
					class="flex size-full items-center justify-center border border-black/60 bg-background text-subtle-foreground"
				>
					<UserRound class="size-10" strokeWidth={1.25} aria-hidden="true" />
				</span>
			{/if}
		</div>
		<div class="relative min-w-0">
			<p
				class={cn(
					'font-heading text-3xl leading-none font-bold sm:text-4xl',
					name ? 'text-gold-100' : 'text-subtle-foreground italic'
				)}
			>
				{name || 'Herói sem nome'}
			</p>
			{#if basicInfo.nickname}
				<p class="mt-1 text-gold-300 italic">“{basicInfo.nickname}”</p>
			{/if}
			{#if subtitle}
				<p class="mt-2 text-muted-foreground">{subtitle}</p>
			{/if}
			{#if basicInfo.motto}
				<p
					class="mt-3 border-l-2 border-gold-700 pl-3 font-heading text-sm text-foreground/80 italic"
				>
					{basicInfo.motto}
				</p>
			{/if}
		</div>
		<div class="relative flex shrink-0 flex-col gap-2 sm:ml-auto sm:flex-row sm:self-center">
			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						try {
							await update();
						} finally {
							saving = false;
						}
					};
				}}
			>
				<input
					type="hidden"
					name="sheet"
					value={JSON.stringify(toCharacterExport(basicInfo, selections, build))}
				/>
				<input type="hidden" name="portrait" value={basicInfo.portrait?.dataUrl ?? ''} />
				<fieldset disabled={saving || pending.length > 0 || atLimit} class="m-0 border-0 p-0">
					<SubmitButton
						pending={saving}
						class="relative inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-md border border-gold-600/60 bg-primary-700 px-3 py-2 text-sm font-medium text-primary-foreground transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:self-center"
					>
						<Save class="size-4" aria-hidden="true" />
						Salvar personagem
					</SubmitButton>
				</fieldset>
			</form>
			<button
				type="button"
				onclick={downloadJson}
				class="relative inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-md border border-border-strong bg-surface/80 px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring sm:self-center"
			>
				<Download class="size-4" aria-hidden="true" />
				Exportar JSON
			</button>
		</div>
	</header>

	<div class="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
		<div class="flex flex-col gap-8">
			<section aria-labelledby="{id}-attributes">
				{@render sectionTitle('Atributos', `${id}-attributes`)}
				<AttributePanel scores={build.scores} keyAbility={build.classPlan?.key} legend={false} />
				{#if !build.boostsDone}
					<p class="mt-2 text-xs text-subtle-foreground">Aumentos ainda incompletos.</p>
				{/if}
			</section>

			<section aria-labelledby="{id}-defenses">
				{@render sectionTitle('Defesas', `${id}-defenses`)}
				{#if build.stats}
					<div class="grid grid-cols-2 gap-2">
						<div
							class="rounded-md border border-border-strong bg-surface-raised/70 p-3 text-center"
						>
							<Heart class="mx-auto size-4 text-primary-400" aria-hidden="true" />
							<p class="font-heading text-2xl leading-tight text-gold-100 tabular-nums">
								{build.stats.hp ?? '—'}
							</p>
							<p
								class="text-[0.65rem] font-semibold tracking-wider text-subtle-foreground uppercase"
							>
								Pontos de vida
							</p>
						</div>
						<div
							class="rounded-md border border-border-strong bg-surface-raised/70 p-3 text-center"
						>
							<Shield class="mx-auto size-4 text-gold-500" aria-hidden="true" />
							<p class="font-heading text-2xl leading-tight text-gold-100 tabular-nums">
								{build.stats.ac}
							</p>
							<p
								class="text-[0.65rem] font-semibold tracking-wider text-subtle-foreground uppercase"
							>
								CA sem armadura
							</p>
						</div>
					</div>
					<dl class="mt-3 flex flex-col gap-1.5">
						{#each defenses as row (row.label)}
							<div
								class="flex items-baseline justify-between gap-3 border-b border-border/50 pb-1.5"
							>
								<dt class="text-sm text-foreground">
									{row.label}
									{@render rankTag(row.rank)}
								</dt>
								<dd class="font-heading text-base text-gold-100 tabular-nums">
									{formatModifier(row.value)}
								</dd>
							</div>
						{/each}
						{#if build.stats.classDc}
							<div class="flex items-baseline justify-between gap-3">
								<dt class="text-sm text-foreground">CD de classe</dt>
								<dd class="font-heading text-base text-gold-100 tabular-nums">
									{build.stats.classDc}
								</dd>
							</div>
						{/if}
					</dl>
				{:else}
					<p class="text-sm text-muted-foreground">Escolha uma classe para calcular as defesas.</p>
				{/if}
			</section>

			{#if ancestry}
				<section aria-labelledby="{id}-traits">
					{@render sectionTitle('Características', `${id}-traits`)}
					<dl class="flex flex-col gap-2 text-sm">
						<div class="flex items-center gap-2">
							<Footprints class="size-4 text-gold-500" aria-hidden="true" />
							<dt class="sr-only">Deslocamento</dt>
							<dd>{ancestry.speed} pés de deslocamento</dd>
						</div>
						<div class="flex items-center gap-2">
							<Ruler class="size-4 text-gold-500" aria-hidden="true" />
							<dt class="sr-only">Tamanho</dt>
							<dd>{getLabel(ancestrySizeMap, ancestry.size)}</dd>
						</div>
						<div class="flex items-center gap-2">
							<Eye class="size-4 text-gold-500" aria-hidden="true" />
							<dt class="sr-only">Visão</dt>
							<dd>
								{ancestry.vision === 'normal'
									? 'Visão normal'
									: getLabel(ancestryVisionMap, ancestry.vision)}
							</dd>
						</div>
						{#if build.stats}
							<div class="flex items-center gap-2">
								<Weight class="size-4 text-gold-500" aria-hidden="true" />
								<dt class="sr-only">Carga</dt>
								<dd>
									Sobrecarregado acima de {build.stats.bulk.encumbered} Volumes, máximo {build.stats
										.bulk.max}
								</dd>
							</div>
						{/if}
						<div class="mt-1">
							<dt
								class="text-[0.7rem] font-semibold tracking-wider text-subtle-foreground uppercase"
							>
								Idiomas
							</dt>
							<dd class="text-foreground">{languages.join(', ')}</dd>
						</div>
					</dl>
				</section>
			{/if}
		</div>

		<div class="flex min-w-0 flex-col gap-8">
			<section aria-labelledby="{id}-skills">
				{@render sectionTitle('Perícias', `${id}-skills`)}
				{#if build.spellcasting}
					<div
						class="bg-gold-950/20 mb-3 flex items-baseline justify-between gap-3 rounded-md border border-gold-800/80 px-3 py-2"
					>
						<span class="flex items-baseline gap-2 text-sm">
							Conjuração
							{#if build.spellcasting.ability}
								<span class="text-[0.65rem] text-subtle-foreground uppercase">
									{abilityLabels[build.spellcasting.ability].short}
								</span>
							{/if}
							<span class="text-[0.65rem] tracking-wider text-gold-400 uppercase">Treinado</span>
						</span>
						<span class="font-heading text-gold-100 tabular-nums">
							{build.spellcasting.modifier === null
								? '—'
								: formatModifier(build.spellcasting.modifier)}
						</span>
					</div>
				{/if}
				<ul class="grid gap-x-6 gap-y-1 sm:grid-cols-2">
					{#each build.skills as skill (skill.key)}
						<li
							class={cn(
								'flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5',
								!skill.trained && 'text-muted-foreground'
							)}
						>
							<span class="flex items-baseline gap-2 text-sm">
								<span
									aria-hidden="true"
									class={cn(
										'size-2 shrink-0 rotate-45 border',
										skill.trained ? 'border-gold-400 bg-gold-500' : 'border-border-strong'
									)}
								></span>
								{getLabel(skillMap, skill.key)}
								<span class="text-[0.65rem] text-subtle-foreground uppercase">
									{abilityLabels[skill.ability].short}
								</span>
								{#if skill.trained}
									<span class="sr-only">(treinado)</span>
								{/if}
							</span>
							<span
								class={cn(
									'font-heading tabular-nums',
									skill.trained ? 'text-gold-100' : 'text-muted-foreground'
								)}
							>
								{formatModifier(skill.modifier)}
							</span>
						</li>
					{/each}
					{#each build.lore as lore (lore)}
						<li class="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5">
							<span class="flex items-baseline gap-2 text-sm">
								<span
									aria-hidden="true"
									class="size-2 shrink-0 rotate-45 border border-gold-400 bg-gold-500"
								></span>
								{lore}
								<span class="text-[0.65rem] text-subtle-foreground uppercase">Int</span>
								<span class="sr-only">(treinado)</span>
							</span>
							<span class="font-heading text-gold-100 tabular-nums">
								{formatModifier(build.scores.INT.modifier + proficiencyBonus(1))}
							</span>
						</li>
					{/each}
				</ul>
			</section>

			{#if proficiencies.length}
				<section aria-labelledby="{id}-proficiencies">
					{@render sectionTitle('Proficiências', `${id}-proficiencies`)}
					<ul class="flex flex-wrap gap-1.5">
						{#each proficiencies as row (row.label)}
							<li
								class="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface-raised/60 px-2.5 py-1 text-sm"
							>
								{row.label}
								{@render rankTag(row.rank)}
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if build.features.length}
				<section aria-labelledby="{id}-features">
					{@render sectionTitle('Habilidades', `${id}-features`)}
					<div class="flex flex-col gap-3">
						{#each build.features as group (group.source)}
							<div class="flex flex-wrap items-center gap-1.5">
								<span
									class="mr-1 inline-flex items-center gap-1 text-[0.7rem] font-semibold tracking-wider text-gold-400 uppercase"
								>
									<Sparkles class="size-3" aria-hidden="true" />
									{group.source}
								</span>
								{#each group.items as feature (feature.name)}
									<FeaturePopover
										{feature}
										class="inline-flex rounded-md border border-border-strong bg-surface-raised px-2.5 py-1 text-sm text-foreground transition-colors hover:border-gold-700"
									/>
								{/each}
							</div>
						{/each}
					</div>
				</section>
			{/if}

			{#if details.length}
				<section aria-labelledby="{id}-details">
					{@render sectionTitle('Detalhes', `${id}-details`)}
					<dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
						{#each details as row (row.label)}
							<div>
								<dt
									class="text-[0.7rem] font-semibold tracking-wider text-subtle-foreground uppercase"
								>
									{row.label}
								</dt>
								<dd class="whitespace-pre-line text-foreground">{row.value}</dd>
							</div>
						{/each}
					</dl>
				</section>
			{/if}
		</div>
	</div>
</div>

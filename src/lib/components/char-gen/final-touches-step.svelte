<script lang="ts">
	import { abilityLabels, type Ability } from '$lib/char-gen/ancestry';
	import {
		FREE_BOOSTS,
		computeBuild,
		formatModifier,
		type FinalTouches,
		type Selections
	} from '$lib/char-gen/build';
	import { featCategoryLabels, type FeatOption } from '$lib/char-gen/feat';
	import FeatPicker from './feat-picker.svelte';
	import FormSection from '$lib/components/ui/form-section.svelte';
	import { getLabel, languageMap, skillMap } from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import { ArrowRight, Check, CircleDashed } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import AttributePanel from './attribute-panel.svelte';
	import AttributeToggleGroup from './attribute-toggle-group.svelte';

	type TabTarget = 'ancestries' | 'background' | 'class';

	type Props = {
		selections: Selections;
		feats: FeatOption[];
		value: FinalTouches;
		ongoto: (tab: TabTarget) => void;
		onnext?: () => void;
	};

	let { selections, feats, value = $bindable(), ongoto, onnext }: Props = $props();

	const build = $derived(computeBuild(selections, value, feats));
	const ancestry = $derived(selections.ancestry);
	const background = $derived(selections.background);
	const classOption = $derived(selections.classOption);

	const skillLabel = (skill: string) => getLabel(skillMap, skill);
	const sourceLabels = { background: 'Antecedente', class: 'Classe', choice: 'Escolha' } as const;

	const skillsDone = $derived(
		!!classOption && build.skillPicks.chosen.length === build.skillPicks.count
	);
	const languagesDone = $derived(
		build.languages.chosen.length ===
			Math.min(build.languages.count, build.languages.options.length)
	);

	function setAncestryFree(free: Ability[]) {
		if (!ancestry || !build.ancestryPlan) return;
		value.ancestry = { for: ancestry.id, alternate: build.ancestryPlan.alternate, free };
	}

	function setAlternate(alternate: boolean) {
		if (!ancestry || !build.ancestryPlan) return;
		value.ancestry = { for: ancestry.id, alternate, free: build.ancestryPlan.free };
	}

	function setBackgroundPick(index: number, pick: Ability | null) {
		if (!background) return;
		const picks = build.backgroundSlots.map((slot) => slot.pick);
		picks[index] = pick;
		value.background = { for: background.id, picks };
	}

	function setClassKey(key: Ability | null) {
		if (!classOption) return;
		value.class = { for: classOption.id, key };
	}

	function toggleSkill(skill: string) {
		const chosen = build.skillPicks.chosen;
		if (chosen.includes(skill)) value.skills = chosen.filter((pick) => pick !== skill);
		else if (chosen.length < build.skillPicks.count) value.skills = [...chosen, skill];
	}

	function setFeat(category: 'class' | 'ancestry' | 'skill' | 'general', id: string) {
		const chosen = (slot: 'class' | 'ancestry' | 'skill' | 'general') =>
			slot === category
				? id || null
				: (build.featSlots.find((entry) => entry.category === slot)?.chosen ?? null);
		value.feats = {
			forClass: classOption?.id ?? null,
			forAncestry: ancestry?.id ?? null,
			class: chosen('class'),
			ancestry: chosen('ancestry'),
			skill: chosen('skill'),
			general: chosen('general')
		};
	}

	const featsDone = $derived(build.featSlots.every((slot) => slot.chosen));

	function toggleLanguage(language: string) {
		const chosen = build.languages.chosen;
		if (chosen.includes(language)) value.languages = chosen.filter((pick) => pick !== language);
		else if (chosen.length < build.languages.count) value.languages = [...chosen, language];
	}

	const quickStats = $derived(
		build.stats
			? [
					{ label: 'PV', value: build.stats.hp === null ? '—' : String(build.stats.hp) },
					{ label: 'CA', value: String(build.stats.ac) },
					{ label: 'Percepção', value: formatModifier(build.stats.perception) },
					{ label: 'Fortitude', value: formatModifier(build.stats.fortitude) },
					{ label: 'Reflexos', value: formatModifier(build.stats.reflex) },
					{ label: 'Vontade', value: formatModifier(build.stats.will) }
				]
			: []
	);
</script>

{#snippet step(
	number: number,
	title: string,
	done: boolean,
	remaining: string | null,
	content: Snippet
)}
	<div class="rounded-lg border border-border bg-surface-raised/60 p-4 sm:p-5">
		<div class="mb-3 flex items-start justify-between gap-3">
			<h3 class="flex items-center gap-2.5 font-heading text-lg leading-tight text-gold-100">
				<span
					aria-hidden="true"
					class="flex size-6 shrink-0 rotate-45 items-center justify-center border border-gold-700 bg-background"
				>
					<span class="-rotate-45 font-logo text-[0.65rem] font-bold text-gold-300">{number}</span>
				</span>
				{title}
			</h3>
			<span
				class={cn(
					'inline-flex shrink-0 items-center gap-1 text-xs font-medium',
					done ? 'text-gold-300' : 'text-subtle-foreground'
				)}
			>
				{#if done}
					<Check class="size-3.5" strokeWidth={3} aria-hidden="true" />
					Pronto
				{:else if remaining}
					<CircleDashed class="size-3.5" aria-hidden="true" />
					{remaining}
				{/if}
			</span>
		</div>
		{@render content()}
	</div>
{/snippet}

{#snippet missing(message: string, tab: TabTarget, action: string)}
	<p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
		{message}
		<button
			type="button"
			onclick={() => ongoto(tab)}
			class="rounded-sm text-gold-300 underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
		>
			{action}
		</button>
	</p>
{/snippet}

{#snippet boostChip(ability: Ability, kind: 'boost' | 'flaw')}
	<span
		class={cn(
			'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm font-medium',
			kind === 'boost'
				? 'border-gold-600 bg-gold-800/40 text-gold-100'
				: 'border-primary-700 bg-primary-950/60 text-primary-200'
		)}
	>
		<span aria-hidden="true" class={kind === 'boost' ? 'text-gold-400' : 'text-primary-400'}>
			{kind === 'boost' ? '+' : '−'}
		</span>
		<span class="sr-only">{kind === 'boost' ? 'Aumento de' : 'Falha em'}</span>
		{abilityLabels[ability].full}
	</span>
{/snippet}

<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
	<div class="flex min-w-0 flex-col gap-10">
		<FormSection
			title="Atributos"
			description="Todo modificador começa em +0. Aumentos do mesmo passo vão para atributos diferentes."
			class="animate-page-in motion-reduce:animate-none"
		>
			<div class="flex flex-col gap-3">
				{#snippet ancestryContent()}
					{#if ancestry && build.ancestryPlan}
						{@const plan = build.ancestryPlan}
						<div class="flex flex-col gap-3">
							{#if plan.fixed.length || plan.flaws.length}
								<div class="flex flex-wrap gap-1.5">
									{#each plan.fixed as ability (ability)}
										{@render boostChip(ability, 'boost')}
									{/each}
									{#each plan.flaws as ability (ability)}
										{@render boostChip(ability, 'flaw')}
									{/each}
								</div>
							{/if}
							{#if plan.freeCount}
								<p class="text-sm text-muted-foreground">
									{plan.freeCount === 1
										? 'Escolha o aumento livre:'
										: `Escolha ${plan.freeCount} aumentos livres:`}
								</p>
								<AttributeToggleGroup
									label="Aumentos livres de {ancestry.name}"
									options={plan.freeOptions}
									value={plan.free}
									max={plan.freeCount}
									onchange={setAncestryFree}
								/>
							{/if}
							<!-- <label class="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
								<input
									type="checkbox"
									checked={plan.alternate}
									onchange={(event) => setAlternate(event.currentTarget.checked)}
									class="mt-0.5 size-4 shrink-0 accent-gold-500"
								/>
								<span>
									Usar aumentos alternativos
									<span class="block text-xs text-subtle-foreground">
										Troca os aumentos e falhas de {ancestry.name} por dois aumentos livres.
									</span>
								</span>
							</label> -->
						</div>
					{:else}
						{@render missing(
							'Nenhuma ancestralidade escolhida.',
							'ancestries',
							'Escolher ancestralidade'
						)}
					{/if}
				{/snippet}
				{@render step(
					1,
					ancestry ? `Ancestralidade: ${ancestry.name}` : 'Ancestralidade',
					!!build.ancestryPlan && build.ancestryPlan.free.length === build.ancestryPlan.freeCount,
					build.ancestryPlan
						? `Falta${build.ancestryPlan.freeCount - build.ancestryPlan.free.length === 1 ? '' : 'm'} ${build.ancestryPlan.freeCount - build.ancestryPlan.free.length}`
						: null,
					ancestryContent
				)}

				{#snippet backgroundContent()}
					{#if background}
						<div class="flex flex-col gap-4">
							{#each build.backgroundSlots as slot, index (index)}
								{@const others = build.backgroundSlots
									.filter((_, other) => other !== index)
									.map((other) => other.pick)
									.filter((pick): pick is Ability => pick !== null)}
								<div class="flex flex-col gap-2">
									<p class="text-sm text-muted-foreground">
										{#if slot.options.length === 6}
											Aumento livre
										{:else}
											Aumento em {slot.options
												.map((ability) => abilityLabels[ability].full)
												.join(' ou ')}
										{/if}
									</p>
									{#if slot.options.length === 1}
										<div>{@render boostChip(slot.options[0], 'boost')}</div>
									{:else}
										<AttributeToggleGroup
											label="Aumento {index + 1} de {background.name}"
											options={slot.options}
											value={slot.pick ? [slot.pick] : []}
											max={1}
											taken={others}
											onchange={(next) => setBackgroundPick(index, next[0] ?? null)}
										/>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						{@render missing('Nenhum antecedente escolhido.', 'background', 'Escolher antecedente')}
					{/if}
				{/snippet}
				{@render step(
					2,
					background ? `Antecedente: ${background.name}` : 'Antecedente',
					!!background && build.backgroundSlots.every((slot) => slot.pick),
					background
						? `Falta${build.backgroundSlots.filter((slot) => !slot.pick).length === 1 ? '' : 'm'} ${build.backgroundSlots.filter((slot) => !slot.pick).length}`
						: null,
					backgroundContent
				)}

				{#snippet classContent()}
					{#if classOption && build.classPlan}
						{@const plan = build.classPlan}
						<div class="flex flex-col gap-2">
							<p class="text-sm text-muted-foreground">
								{#if plan.options.length === 1}
									Atributo-chave de {classOption.name}:
								{:else if classOption.keyAbilities.length}
									Escolha o atributo-chave:
								{:else}
									O atributo-chave vem da subclasse. Escolha o que ela indicar:
								{/if}
							</p>
							{#if plan.options.length === 1}
								<div>{@render boostChip(plan.options[0], 'boost')}</div>
							{:else}
								<AttributeToggleGroup
									label="Atributo-chave de {classOption.name}"
									options={plan.options}
									value={plan.key ? [plan.key] : []}
									max={1}
									onchange={(next) => setClassKey(next[0] ?? null)}
								/>
							{/if}
						</div>
					{:else}
						{@render missing('Nenhuma classe escolhida.', 'class', 'Escolher classe')}
					{/if}
				{/snippet}
				{@render step(
					3,
					classOption ? `Classe: ${classOption.name}` : 'Classe',
					!!build.classPlan?.key,
					classOption ? 'Falta 1' : null,
					classContent
				)}

				{#snippet freeContent()}
					<AttributeToggleGroup
						label="Quatro aumentos livres"
						options={['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']}
						value={build.freeBoosts}
						max={FREE_BOOSTS}
						onchange={(next) => (value.freeBoosts = next)}
					/>
				{/snippet}
				{@render step(
					4,
					'Aumentos livres',
					build.freeBoosts.length === FREE_BOOSTS,
					`Falta${FREE_BOOSTS - build.freeBoosts.length === 1 ? '' : 'm'} ${FREE_BOOSTS - build.freeBoosts.length}`,
					freeContent
				)}
			</div>
		</FormSection>

		<FormSection
			title="Perícias"
			description="Seu antecedente e sua classe já treinam algumas. As demais vêm da classe mais seu modificador de Inteligência."
			class="animate-page-in [animation-delay:80ms] motion-reduce:animate-none"
		>
			{#if classOption}
				<div class="flex flex-col gap-4">
					{#if build.spellcasting}
						<div class="bg-gold-950/30 rounded-md border border-gold-700/70 px-3 py-3">
							<div class="flex items-baseline justify-between gap-3">
								<p class="font-heading text-base text-gold-100">Conjuração</p>
								<p class="text-xs font-semibold tracking-wider text-gold-400 uppercase">Treinado</p>
							</div>
							<p class="mt-1 text-sm text-muted-foreground">
								{#if build.spellcasting.ability && build.spellcasting.modifier !== null}
									Bônus {formatModifier(build.spellcasting.modifier)} com
									{abilityLabels[build.spellcasting.ability].full}.
								{:else}
									Treinado no atributo-chave. Escolha esse atributo para ver o bônus.
								{/if}
							</p>
						</div>
					{/if}
					<p
						aria-live="polite"
						class={cn('text-sm', skillsDone ? 'text-gold-300' : 'text-muted-foreground')}
					>
						{build.skillPicks.chosen.length} de {build.skillPicks.count}
						{build.skillPicks.count === 1 ? 'perícia escolhida' : 'perícias escolhidas'}
					</p>
					<ul class="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
						{#each build.skills as skill (skill.key)}
							{@const automatic = skill.source === 'background' || skill.source === 'class'}
							{@const chosen = skill.source === 'choice'}
							<li>
								<button
									type="button"
									aria-pressed={skill.trained}
									disabled={automatic ||
										(!chosen && build.skillPicks.chosen.length >= build.skillPicks.count)}
									onclick={() => toggleSkill(skill.key)}
									class={cn(
										'flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed',
										skill.trained
											? 'border-gold-600 bg-gold-900/40 text-gold-100'
											: 'border-border bg-input text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-40 disabled:hover:border-border'
									)}
								>
									<span class="min-w-0 truncate">{skillLabel(skill.key)}</span>
									<span class="shrink-0 text-[0.65rem] font-semibold tracking-wider uppercase">
										{#if automatic && skill.source}
											<span class="text-gold-400">{sourceLabels[skill.source]}</span>
										{:else}
											<span class="tabular-nums">{formatModifier(skill.modifier)}</span>
										{/if}
									</span>
								</button>
							</li>
						{/each}
					</ul>
					{#if build.lore.length}
						<p class="text-sm text-muted-foreground">
							<span class="text-subtle-foreground">Conhecimento do antecedente:</span>
							{build.lore.join(', ')}
						</p>
					{/if}
				</div>
			{:else}
				{@render missing(
					'Escolha uma classe para saber quantas perícias treinar.',
					'class',
					'Escolher classe'
				)}
			{/if}
		</FormSection>

		<FormSection
			title="Talentos"
			description="Só entram os talentos de 1º nível que a classe concede nesse nível."
			class="animate-page-in [animation-delay:100ms] motion-reduce:animate-none"
		>
			{#if classOption}
				{#if build.featSlots.length}
					<div class="flex flex-col gap-4">
						<p class={cn('text-sm', featsDone ? 'text-gold-300' : 'text-muted-foreground')}>
							{build.featSlots.filter((slot) => slot.chosen).length} de {build.featSlots.length}
							{build.featSlots.length === 1 ? 'talento escolhido' : 'talentos escolhidos'}
						</p>
						{#each build.featSlots as slot (slot.category)}
							<FeatPicker
								label={featCategoryLabels[slot.category]}
								options={slot.options}
								value={slot.chosen}
								onselect={(id) => setFeat(slot.category, id)}
							/>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">
						{classOption.name} não recebe talento de classe, ancestralidade, perícia ou geral no 1º nível.
					</p>
				{/if}
			{:else}
				{@render missing(
					'Escolha uma classe para ver os talentos de 1º nível.',
					'class',
					'Escolher classe'
				)}
			{/if}
		</FormSection>

		<FormSection
			title="Idiomas"
			description="Idiomas adicionais saem da lista da ancestralidade, um por ponto de Inteligência."
			class="animate-page-in [animation-delay:120ms] motion-reduce:animate-none"
		>
			{#if ancestry}
				<div class="flex flex-col gap-3">
					<p class="text-foreground">
						{build.languages.fixed.map((language) => getLabel(languageMap, language)).join(', ')}
					</p>
					{#if build.languages.count > 0 && build.languages.options.length}
						<p class={cn('text-sm', languagesDone ? 'text-gold-300' : 'text-muted-foreground')}>
							{build.languages.chosen.length} de {Math.min(
								build.languages.count,
								build.languages.options.length
							)} adicionais
						</p>
						<ul class="flex flex-wrap gap-1.5">
							{#each build.languages.options as language (language)}
								{@const chosen = build.languages.chosen.includes(language)}
								<li>
									<button
										type="button"
										aria-pressed={chosen}
										disabled={!chosen && build.languages.chosen.length >= build.languages.count}
										onclick={() => toggleLanguage(language)}
										class={cn(
											'rounded-md border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed',
											chosen
												? 'border-gold-600 bg-gold-900/40 text-gold-100'
												: 'border-border bg-input text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-40'
										)}
									>
										{getLabel(languageMap, language)}
									</button>
								</li>
							{/each}
						</ul>
					{:else if build.languages.count > 0}
						<p class="text-sm text-muted-foreground">
							Você tem {build.languages.count}
							{build.languages.count === 1 ? 'idioma adicional' : 'idiomas adicionais'}. Combine com
							o mestre quais idiomas comuns aprender.
						</p>
					{:else}
						<p class="text-sm text-subtle-foreground">
							Sem idiomas adicionais: seu modificador de Inteligência é {formatModifier(
								build.scores.INT.modifier
							)}.
						</p>
					{/if}
				</div>
			{:else}
				{@render missing(
					'Nenhuma ancestralidade escolhida.',
					'ancestries',
					'Escolher ancestralidade'
				)}
			{/if}
		</FormSection>
	</div>

	<aside
		aria-label="Prévia dos atributos"
		class="flex animate-page-in flex-col gap-5 motion-reduce:animate-none max-lg:-order-1 lg:sticky lg:top-24 lg:self-start"
	>
		<div class="rounded-lg border border-gold-800 bg-surface-raised/50 p-4">
			<h2 class="mb-3 text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">
				Modificadores
			</h2>
			<AttributePanel scores={build.scores} keyAbility={build.classPlan?.key} />
		</div>

		{#if quickStats.length}
			<dl class="grid grid-cols-3 gap-2 rounded-lg border border-border bg-surface-raised/50 p-3">
				{#each quickStats as stat (stat.label)}
					<div class="text-center">
						<dt
							class="text-[0.65rem] font-semibold tracking-wider text-subtle-foreground uppercase"
						>
							{stat.label}
						</dt>
						<dd class="font-heading text-lg leading-tight text-gold-100 tabular-nums">
							{stat.value}
						</dd>
					</div>
				{/each}
			</dl>
		{/if}

		{#if onnext}
			<button
				type="button"
				onclick={onnext}
				class="group inline-flex items-center justify-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-5 py-3 font-heading text-base font-semibold text-primary-foreground shadow-lg shadow-primary-950/60 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px max-lg:hidden"
			>
				Próximo: Resumo
				<ArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
			</button>
		{/if}
	</aside>

	{#if onnext}
		<div class="flex justify-end border-t border-border pt-6 lg:hidden">
			<button
				type="button"
				onclick={onnext}
				class="group inline-flex w-full items-center justify-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-5 py-3 font-heading text-base font-semibold text-primary-foreground shadow-lg shadow-primary-950/60 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px"
			>
				Próximo: Resumo
				<ArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
			</button>
		</div>
	{/if}
</div>

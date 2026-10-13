<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { abilityLabels } from '$lib/char-gen/ancestry';
	import {
		classRarityLabels,
		proficiencyLabels,
		type ClassOption,
		type ProficiencyRank
	} from '$lib/char-gen/class';
	import { classAttackMap, getLabel, skillMap } from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import {
		ArrowRight,
		ChevronDown,
		Eye,
		GraduationCap,
		Heart,
		KeyRound,
		Sparkles,
		WandSparkles,
		X
	} from 'lucide-svelte';
	import FeaturePopover from './feature-popover.svelte';
	import RarityBadge from './rarity-badge.svelte';

	type Props = {
		option: ClassOption | null;
		open: boolean;
		selected?: boolean;
		onconfirm: () => void;
	};

	let { option, open = $bindable(false), selected = false, onconfirm }: Props = $props();

	const id = $props.id();

	const rankClasses: Record<ProficiencyRank, string> = {
		0: 'border-border text-subtle-foreground',
		1: 'border-border-strong text-foreground',
		2: 'border-gold-700 text-gold-200',
		3: 'border-gold-500 bg-gold-800/40 text-gold-100',
		4: 'border-primary-500 bg-primary-800/60 text-primary-100'
	};

	const keyAbility = $derived(
		option?.keyAbilities.length
			? option.keyAbilities.map((ability) => abilityLabels[ability].full).join(' ou ')
			: 'Definido pela subclasse'
	);

	const proficiencyGroups = $derived(
		option
			? [
					{
						title: 'Resistências',
						rows: [
							{ label: 'Fortitude', rank: option.saves.fortitude },
							{ label: 'Reflexos', rank: option.saves.reflex },
							{ label: 'Vontade', rank: option.saves.will }
						]
					},
					{
						title: 'Ataques',
						rows: [
							{ label: 'Armas simples', rank: option.attacks.simple },
							{ label: 'Armas marciais', rank: option.attacks.martial },
							{ label: 'Armas avançadas', rank: option.attacks.advanced },
							{ label: 'Desarmado', rank: option.attacks.unarmed },
							...(option.attacks.other
								? [
										{
											label: getLabel(classAttackMap, option.attacks.other.name),
											rank: option.attacks.other.rank
										}
									]
								: [])
						]
					},
					{
						title: 'Defesas',
						rows: [
							{ label: 'Sem armadura', rank: option.defenses.unarmored },
							{ label: 'Armadura leve', rank: option.defenses.light },
							{ label: 'Armadura média', rank: option.defenses.medium },
							{ label: 'Armadura pesada', rank: option.defenses.heavy }
						]
					}
				]
			: []
	);

	const firstLevel = $derived(option?.features.filter((feature) => feature.level === 1) ?? []);
	const progression = $derived.by(() => {
		const rows: Array<{ level: number; features: ClassOption['features'] }> = [];
		for (const feature of option?.features ?? []) {
			if (feature.level === 1) continue;
			const row = rows.find((candidate) => candidate.level === feature.level);
			if (row) row.features.push(feature);
			else rows.push({ level: feature.level, features: [feature] });
		}
		return rows;
	});
</script>

{#snippet rankChip(rank: ProficiencyRank)}
	<span
		class={cn(
			'inline-flex min-w-6 items-center justify-center rounded-sm border px-1.5 py-0.5 text-[0.65rem] leading-none font-bold tracking-wider uppercase',
			rankClasses[rank]
		)}
	>
		{#if rank === 0}
			<span aria-hidden="true">—</span>
			<span class="sr-only">{proficiencyLabels[0]}</span>
		{:else}
			{proficiencyLabels[rank]}
		{/if}
	</span>
{/snippet}

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
		/>
		<Dialog.Content
			class="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border-strong bg-surface shadow-2xl shadow-black outline-none data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in motion-reduce:animate-none sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[86dvh] sm:w-[min(48rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border-b sm:data-[state=closed]:animate-dialog-out sm:data-[state=open]:animate-dialog-in"
		>
			{#if option}
				<div class="relative overflow-y-auto overscroll-contain">
					<div
						class="relative overflow-hidden border-b border-gold-800/60 bg-radial-[at_15%_0%] from-primary-900/60 via-surface to-surface"
					>
						<div
							aria-hidden="true"
							class="relative mx-auto mt-2.5 h-1 w-10 rounded-full bg-border-strong sm:hidden"
						></div>

						<div class="relative flex items-center gap-4 px-5 pt-5 pb-5 sm:gap-6 sm:px-7 sm:pt-7">
							<div class="relative flex size-24 shrink-0 items-center justify-center sm:size-32">
								<span
									aria-hidden="true"
									class="absolute inset-2 rotate-45 border border-gold-600 bg-background/60 shadow-xl shadow-black/60"
								></span>
								<img
									src={option.image}
									alt="Emblema de {option.name}"
									width="256"
									height="245"
									class="relative size-20 object-contain drop-shadow-[0_6px_10px_rgb(0_0_0/0.6)] sm:size-28"
								/>
							</div>
							<div class="min-w-0 pb-1">
								<div class="mb-2 flex flex-wrap items-center gap-1.5">
									<RarityBadge
										rarity={option.rarity}
										label={classRarityLabels[option.rarity].singular}
									/>
									{#if option.legacy}
										<span
											class="rounded-sm border border-border-strong bg-background/70 px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-muted-foreground uppercase"
											title="Regras anteriores ao Remaster"
										>
											Legado
										</span>
									{/if}
									{#if option.spellcaster}
										<span
											class="inline-flex items-center gap-1 rounded-sm border border-gold-800 px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-gold-300 uppercase"
										>
											<WandSparkles class="size-3" aria-hidden="true" />
											Conjurador
										</span>
									{/if}
								</div>
								<Dialog.Title
									class="font-heading text-3xl leading-none font-bold text-gold-100 sm:text-4xl"
								>
									{option.name}
								</Dialog.Title>
								<p class="mt-1.5 text-sm text-muted-foreground">
									{option.features.length}
									{option.features.length === 1 ? 'habilidade de classe' : 'habilidades de classe'} até
									o nível 20
								</p>
							</div>
						</div>
					</div>

					<div class="flex flex-col gap-7 px-5 py-6 sm:px-7">
						{#if option.description}
							<Dialog.Description
								class="font-heading text-base leading-relaxed text-foreground/90 first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-logo first-letter:text-5xl first-letter:leading-none first-letter:text-gold-300"
							>
								{option.description}
							</Dialog.Description>
						{/if}

						<dl class="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border/70 py-3">
							<div class="flex items-center gap-1.5" title="Pontos de vida por nível">
								<Heart class="size-4 text-primary-400" aria-hidden="true" />
								<dt class="sr-only">Pontos de vida por nível</dt>
								<dd class="font-heading text-base leading-none text-gold-100">
									{option.hp} + Con por nível
								</dd>
							</div>
							<div class="flex items-center gap-1.5" title="Atributo-chave">
								<KeyRound class="size-4 text-gold-500" aria-hidden="true" />
								<dt class="sr-only">Atributo-chave</dt>
								<dd class="font-heading text-base leading-none text-gold-100">{keyAbility}</dd>
							</div>
							<div class="flex items-center gap-1.5" title="Percepção">
								<Eye class="size-4 text-gold-500" aria-hidden="true" />
								<dt class="text-sm text-muted-foreground">Percepção</dt>
								<dd>{@render rankChip(option.perception)}</dd>
							</div>
						</dl>

						<section aria-labelledby="{id}-proficiencies" class="flex flex-col gap-3">
							<h3
								id="{id}-proficiencies"
								class="text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase"
							>
								Proficiências iniciais
							</h3>
							<div class="grid gap-3 sm:grid-cols-3">
								{#each proficiencyGroups as group (group.title)}
									<div class="rounded-md border border-border/80 bg-surface-raised/60 p-3">
										<h4
											class="mb-2 text-[0.7rem] font-semibold tracking-wider text-subtle-foreground uppercase"
										>
											{group.title}
										</h4>
										<dl class="flex flex-col gap-1.5">
											{#each group.rows as row (row.label)}
												<div class="flex items-center justify-between gap-3">
													<dt
														class={cn(
															'text-sm',
															row.rank === 0 ? 'text-subtle-foreground' : 'text-foreground'
														)}
													>
														{row.label}
													</dt>
													<dd class="shrink-0">{@render rankChip(row.rank)}</dd>
												</div>
											{/each}
										</dl>
									</div>
								{/each}
							</div>
						</section>

						<section aria-labelledby="{id}-skills" class="flex flex-col gap-2">
							<h3
								id="{id}-skills"
								class="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase"
							>
								<GraduationCap class="size-3.5" aria-hidden="true" />
								Perícias treinadas
							</h3>
							<p class="text-foreground">
								{#if option.skills.length}
									{option.skills.map((skill) => getLabel(skillMap, skill)).join(', ')}
									<span class="text-muted-foreground">
										e mais {option.additionalSkills} à sua escolha
									</span>
								{:else}
									{option.additionalSkills} à sua escolha
								{/if}
								<span class="text-sm text-subtle-foreground">(+ modificador de Inteligência)</span>
							</p>
						</section>

						{#if firstLevel.length}
							<section aria-labelledby="{id}-features" class="flex flex-col gap-2">
								<h3
									id="{id}-features"
									class="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase"
								>
									<Sparkles class="size-3.5" aria-hidden="true" />
									Habilidades no 1º nível
								</h3>
								<ul class="flex flex-wrap gap-1.5">
									{#each firstLevel as feature (feature.name)}
										<li>
											<FeaturePopover
												{feature}
												class="inline-flex rounded-md border border-border-strong bg-surface-raised px-2.5 py-1 text-sm text-foreground transition-colors hover:border-gold-700"
											/>
										</li>
									{/each}
								</ul>
							</section>
						{/if}

						{#if progression.length}
							<details
								class="group/progression rounded-md border border-border/80 bg-surface-raised/40"
							>
								<summary
									class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md px-3 py-2.5 text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
								>
									Progressão até o nível 20
									<ChevronDown
										class="size-4 transition-transform duration-200 group-open/progression:rotate-180"
										aria-hidden="true"
									/>
								</summary>
								<ol class="flex flex-col border-t border-border/70 px-3 py-2">
									{#each progression as row (row.level)}
										<li
											class="flex items-baseline gap-3 border-b border-border/40 py-2 last:border-b-0"
										>
											<span class="w-14 shrink-0 font-heading text-sm text-gold-400 tabular-nums">
												Nível {row.level}
											</span>
											<span class="flex flex-wrap gap-x-3 gap-y-1">
												{#each row.features as feature (feature.name)}
													<FeaturePopover {feature} class="text-left text-sm text-foreground" />
												{/each}
											</span>
										</li>
									{/each}
								</ol>
							</details>
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
						{option.name}
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

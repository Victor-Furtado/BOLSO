<script lang="ts">
	import { RadioGroup } from 'bits-ui';
	import {
		backgroundOriginLabels,
		backgroundRarityLabels,
		type BackgroundOption
	} from '$lib/char-gen/background';
	import { getLabel, skillMap } from '$lib/utils/map';
	import { cn } from '$lib/utils/ui';
	import { Check, GraduationCap, MapPin, Sparkles } from 'lucide-svelte';
	import BackgroundBoosts from './background-boosts.svelte';
	import FeaturePopover from './feature-popover.svelte';
	import RarityBadge from './rarity-badge.svelte';

	type Props = {
		background: BackgroundOption;
		index: number;
	};

	let { background, index }: Props = $props();

	const skills = $derived([
		...background.skills.map((skill) => getLabel(skillMap, skill)),
		...background.lore
	]);
	const badge =
		'rounded-sm border border-border-strong px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-muted-foreground uppercase';
</script>

<RadioGroup.Item
	value={background.id}
	class="group relative flex h-full w-full animate-page-in flex-col gap-2.5 rounded-lg border border-border bg-surface-raised/70 p-4 text-left shadow-md shadow-black/30 transition-[border-color,background-color] duration-200 outline-none hover:border-gold-800 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface data-[state=checked]:border-gold-400 data-[state=checked]:bg-primary-950/50 motion-reduce:animate-none sm:p-5"
	style="animation-delay: {Math.min(index % 24, 10) * 30}ms"
>
	{#snippet children({ checked })}
		<span
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 rounded-lg bg-radial-[at_0%_0%] from-primary-700/25 to-transparent to-60% opacity-0 transition-opacity duration-300 group-data-[state=checked]:opacity-100"
		></span>

		<span class="relative flex items-start justify-between gap-3">
			<span class="flex min-w-0 flex-col gap-1.5">
				<span class="font-heading text-lg leading-tight font-semibold text-gold-100">
					{background.name}
				</span>
				{#if background.rarity !== 'common' || background.origin !== 'core' || background.legacy || background.prerequisite}
					<span class="flex flex-wrap gap-1.5">
						{#if background.rarity !== 'common'}
							<RarityBadge
								rarity={background.rarity}
								label={backgroundRarityLabels[background.rarity].singular}
							/>
						{/if}
						{#if background.origin !== 'core'}
							<span class={badge} title={background.originDetail ?? undefined}>
								{backgroundOriginLabels[background.origin]}
							</span>
						{/if}
						{#if background.legacy}
							<span class={badge}>Legado</span>
						{/if}
						{#if background.prerequisite}
							<span
								class="inline-flex items-center gap-1 rounded-sm border border-gold-800 px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold text-gold-300"
							>
								<MapPin class="size-2.5" aria-hidden="true" />
								<span class="sr-only">Pré-requisito:</span>
								{background.prerequisite}
							</span>
						{/if}
					</span>
				{/if}
			</span>
			<span
				aria-hidden="true"
				class={cn(
					'mt-0.5 flex size-5 shrink-0 rotate-45 items-center justify-center border transition-colors duration-200',
					checked ? 'border-gold-300 bg-primary-700' : 'border-border-strong bg-background'
				)}
			>
				{#if checked}
					<Check class="size-3 -rotate-45 text-gold-100" strokeWidth={3.5} />
				{/if}
			</span>
		</span>

		{#if background.summary}
			<span
				class={cn(
					'relative text-sm leading-relaxed text-muted-foreground',
					!checked && 'line-clamp-3'
				)}
			>
				{background.summary}
			</span>
		{:else}
			<span class="relative text-sm text-subtle-foreground italic">
				Descrição ainda não traduzida.
			</span>
		{/if}

		<span class="relative mt-auto flex flex-col gap-2 pt-1">
			<BackgroundBoosts boosts={background.boosts} />

			{#if skills.length}
				<span class="flex items-start gap-1.5 text-xs text-foreground/85">
					<GraduationCap class="mt-px size-3.5 shrink-0 text-gold-500" aria-hidden="true" />
					<span class="sr-only">Perícias treinadas:</span>
					<span>{skills.join(' · ')}</span>
				</span>
			{/if}

			{#if background.grants.length}
				<span class="flex flex-wrap items-center gap-1.5">
					<span
						class="inline-flex items-center gap-1 text-[0.7rem] font-semibold tracking-wider text-gold-400 uppercase"
					>
						<Sparkles class="size-3" aria-hidden="true" />
						Concede
					</span>
					{#each background.grants as grant (grant.name)}
						<FeaturePopover
							feature={grant}
							nested
							class="rounded-md border border-gold-800 bg-gold-900/40 px-2 py-0.5 text-xs text-gold-100 transition-colors hover:border-gold-600"
						/>
					{/each}
				</span>
			{/if}
		</span>

		{#if checked && background.rules}
			<span
				class="relative border-l-2 border-gold-700/70 pl-3 text-xs leading-relaxed text-muted-foreground"
			>
				{background.rules}
			</span>
		{/if}
	{/snippet}
</RadioGroup.Item>

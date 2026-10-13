<script lang="ts">
	import {
		rarityLabels,
		rarityOrder,
		type AncestryOption,
		type Rarity
	} from '$lib/char-gen/ancestry';
	import { cn } from '$lib/utils/ui';
	import AncestryCard from './ancestry-card.svelte';
	import AncestryDossier from './ancestry-dossier.svelte';

	type Props = {
		ancestries: AncestryOption[];
		selectedId: string | null;
		onselect: (id: string) => void;
	};

	let { ancestries, selectedId, onselect }: Props = $props();

	const id = $props.id();

	let inspectedId = $state<string | null>(null);
	let dossierOpen = $state(false);

	const gemClasses: Record<Rarity, string> = {
		common: 'bg-gold-400',
		uncommon: 'bg-rarity-uncommon',
		rare: 'bg-rarity-rare',
		unique: 'bg-rarity-unique'
	};

	const groups = $derived(
		rarityOrder
			.map((rarity) => ({ rarity, items: ancestries.filter((a) => a.rarity === rarity) }))
			.filter((group) => group.items.length > 0)
	);

	const inspected = $derived(ancestries.find((a) => a.id === inspectedId) ?? null);

	function inspect(ancestryId: string) {
		inspectedId = ancestryId;
		dossierOpen = true;
	}

	function confirm() {
		if (inspectedId) onselect(inspectedId);
		dossierOpen = false;
	}
</script>

<div class="flex flex-col gap-8">
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
					{rarityLabels[group.rarity].plural}
				</span>
				<span class="text-xs text-subtle-foreground tabular-nums">{group.items.length}</span>
				<span aria-hidden="true" class="h-px flex-1 bg-linear-to-r from-gold-700/80 to-transparent"
				></span>
			</h2>

			<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
				{#each group.items as ancestry (ancestry.id)}
					<li>
						<AncestryCard
							{ancestry}
							selected={ancestry.id === selectedId}
							onclick={() => inspect(ancestry.id)}
						/>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<AncestryDossier
	ancestry={inspected}
	bind:open={dossierOpen}
	selected={inspectedId === selectedId}
	onconfirm={confirm}
/>

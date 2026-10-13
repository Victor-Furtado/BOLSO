<script lang="ts">
	import { rarityLabels, type Rarity } from '$lib/char-gen/ancestry';
	import { cn } from '$lib/utils/ui';

	let {
		rarity,
		label,
		class: className
	}: { rarity: Rarity; label?: string; class?: string } = $props();

	const rarityClasses: Record<Rarity, string> = {
		common: 'bg-rarity-common',
		uncommon: 'bg-rarity-uncommon',
		rare: 'bg-rarity-rare',
		unique: 'bg-rarity-unique'
	};
</script>

<span
	class={cn(
		'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[0.65rem] leading-none font-bold tracking-wider text-white uppercase shadow-sm shadow-black/50',
		rarityClasses[rarity],
		className
	)}
>
	{label ?? rarityLabels[rarity].singular}
</span>

<script lang="ts">
	import { abilityLabels, type Ability } from '$lib/char-gen/ancestry';
	import { abilities } from '$lib/char-gen/build';
	import { cn } from '$lib/utils/ui';

	type Props = {
		label: string;
		/** Attributes this group may pick; the rest render disabled. */
		options: readonly Ability[];
		value: Ability[];
		max: number;
		/** Attributes that can't be picked here because another slot already took them. */
		taken?: readonly Ability[];
		onchange: (next: Ability[]) => void;
	};

	let { label, options, value, max, taken = [], onchange }: Props = $props();

	function toggle(ability: Ability) {
		if (value.includes(ability)) onchange(value.filter((pick) => pick !== ability));
		else if (max === 1) onchange([ability]);
		else if (value.length < max) onchange([...value, ability]);
	}
</script>

<div role="group" aria-label={label} class="grid grid-cols-6 gap-1.5">
	{#each abilities as ability (ability)}
		{@const pressed = value.includes(ability)}
		{@const disabled =
			!pressed &&
			(!options.includes(ability) || taken.includes(ability) || (max > 1 && value.length >= max))}
		<button
			type="button"
			aria-pressed={pressed}
			{disabled}
			title={abilityLabels[ability].full}
			onclick={() => toggle(ability)}
			class={cn(
				'h-11 rounded-md border text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed',
				pressed
					? 'border-gold-400 bg-gold-800/50 text-gold-100'
					: 'border-border bg-input text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-35 disabled:hover:border-border disabled:hover:text-muted-foreground'
			)}
		>
			<span aria-hidden="true">{abilityLabels[ability].short}</span>
			<span class="sr-only">{abilityLabels[ability].full}</span>
		</button>
	{/each}
</div>

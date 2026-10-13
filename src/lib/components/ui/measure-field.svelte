<script lang="ts">
	import { cn } from '$lib/utils/ui';
	import FormField, { inputClass } from './form-field.svelte';

	type Props = {
		value: number | null;
		label: string;
		suffix: string;
		unitName: string;
		hint?: string;
		placeholder?: string;
		min?: number;
		max?: number;
		step?: number;
		class?: string;
	};

	let {
		value = $bindable(null),
		label,
		suffix,
		unitName,
		hint,
		placeholder,
		min,
		max,
		step = 1,
		class: className
	}: Props = $props();

	const id = $props.id();
</script>

<FormField {id} {label} {hint} {unitName} class={className}>
	<div class="relative">
		<input
			{id}
			type="number"
			inputmode={Number.isInteger(step) ? 'numeric' : 'decimal'}
			bind:value
			{min}
			{max}
			{step}
			{placeholder}
			aria-describedby={hint ? `${id}-hint` : undefined}
			class={cn(
				inputClass,
				'[appearance:textfield] pr-12 tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
			)}
		/>
		<span
			aria-hidden="true"
			class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-subtle-foreground"
		>
			{suffix}
		</span>
	</div>
</FormField>

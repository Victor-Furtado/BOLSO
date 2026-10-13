<script lang="ts">
	import { inputClass } from '$lib/components/ui/form-field.svelte';
	import { cn } from '$lib/utils/ui';
	import { Eye, EyeOff } from 'lucide-svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Omit<HTMLInputAttributes, 'type' | 'value'> & {
		id: string;
		value: string;
		ref?: HTMLInputElement | null;
	};

	let {
		id,
		value = $bindable(),
		ref = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	let visible = $state(false);
</script>

<div class="relative">
	<input
		{id}
		bind:this={ref}
		bind:value
		type={visible ? 'text' : 'password'}
		class={cn(inputClass, 'pr-12', className)}
		{...rest}
	/>
	<button
		type="button"
		onclick={() => (visible = !visible)}
		aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
		aria-pressed={visible}
		aria-controls={id}
		class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-subtle-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
	>
		{#if visible}
			<EyeOff class="size-4" aria-hidden="true" />
		{:else}
			<Eye class="size-4" aria-hidden="true" />
		{/if}
	</button>
</div>

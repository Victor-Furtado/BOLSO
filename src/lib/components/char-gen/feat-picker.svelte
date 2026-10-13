<script lang="ts">
	import type { FeatOption } from '$lib/char-gen/feat';
	import { cn } from '$lib/utils/ui';
	import { Check } from 'lucide-svelte';

	type Props = {
		label: string;
		options: FeatOption[];
		value: string | null;
		onselect: (id: string) => void;
	};

	let { label, options, value, onselect }: Props = $props();

	let query = $state('');
	let previewId = $state<string | null>(null);

	const filtered = $derived(
		options.filter((feat) =>
			feat.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
		)
	);
	const preview = $derived(
		filtered.find((feat) => feat.id === previewId) ??
			filtered.find((feat) => feat.id === value) ??
			filtered[0] ??
			null
	);
</script>

<fieldset class="flex flex-col gap-2">
	<legend class="text-sm text-muted-foreground">{label}</legend>
	<div class="grid items-start gap-3 sm:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)]">
		<div class="flex min-w-0 flex-col gap-1.5">
			<input
				type="search"
				bind:value={query}
				placeholder="Buscar talento"
				aria-label="Buscar {label}"
				class="rounded-md border border-border bg-input px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring"
			/>
			<div
				role="radiogroup"
				aria-label={label}
				class="flex max-h-64 flex-col gap-1 overflow-y-auto overscroll-contain"
			>
				{#each filtered as feat (feat.id)}
					<button
						type="button"
						role="radio"
						aria-checked={value === feat.id}
						onclick={() => onselect(feat.id)}
						onpointerenter={() => (previewId = feat.id)}
						onfocus={() => (previewId = feat.id)}
						class={cn(
							'flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
							value === feat.id
								? 'border-gold-600 bg-gold-900/40 text-gold-100'
								: preview?.id === feat.id
									? 'border-border-strong bg-surface-hover text-foreground'
									: 'border-transparent text-foreground hover:bg-surface-hover'
						)}
					>
						<span class="min-w-0 truncate">{feat.name}</span>
						{#if value === feat.id}
							<Check class="size-3.5 shrink-0 text-gold-400" strokeWidth={3} aria-hidden="true" />
						{/if}
					</button>
				{:else}
					<p class="px-2 py-3 text-sm text-muted-foreground">Nenhum talento com esse nome.</p>
				{/each}
			</div>
		</div>

		<article
			aria-live="polite"
			class="min-h-40 rounded-md border border-gold-800/70 bg-surface-raised/70 px-4 py-3"
		>
			{#if preview}
				<h4 class="font-heading text-lg leading-tight text-gold-100">{preview.name}</h4>
				{#if preview.description}
					<p class="mt-2 text-sm leading-snug text-foreground/90">{preview.description}</p>
				{/if}
				{#if preview.rules}
					<p class="mt-3 text-[0.65rem] font-semibold tracking-wider text-gold-400 uppercase">
						Regras
					</p>
					<p class="mt-1 text-sm leading-snug text-foreground/85">{preview.rules}</p>
				{/if}
				{#if !preview.description && !preview.rules}
					<p class="mt-2 text-sm text-muted-foreground">Este talento não tem texto no catálogo.</p>
				{/if}
				<p class="mt-3 text-xs text-subtle-foreground">
					{value === preview.id ? 'Escolhido' : 'Clique no nome para escolher'}
				</p>
			{:else}
				<p class="text-sm text-muted-foreground">Nenhum talento nesta lista.</p>
			{/if}
		</article>
	</div>
</fieldset>

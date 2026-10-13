<script lang="ts" module>
	export const submitButtonClass =
		'group mt-1 inline-flex items-center justify-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-5 py-3 font-heading text-base font-semibold text-primary-foreground shadow-lg shadow-primary-950/60 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px';

	export const linkClass =
		'rounded-sm font-medium text-gold-300 underline-offset-4 outline-none hover:text-gold-200 hover:underline focus-visible:ring-2 focus-visible:ring-ring';
</script>

<script lang="ts">
	import logo from '$lib/assets/logo.svg';
	import Ornament from '$lib/components/ui/ornament.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		description: string;
		children: Snippet;
		footer?: Snippet;
	};

	let { title, description, children, footer }: Props = $props();
</script>

<div class="flex min-h-[70dvh] items-center justify-center py-4 sm:py-10">
	<div
		class="w-full max-w-md animate-page-in rounded-xl border border-border-strong bg-surface p-1.5 shadow-2xl shadow-black/50 motion-reduce:animate-none sm:p-2"
	>
		<div
			class="relative rounded-lg border border-gold-800 bg-radial-[at_50%_0%] from-primary-950/60 via-surface to-surface px-5 py-8 sm:px-10 sm:py-10"
		>
			<Ornament class="-top-1 -left-1" />
			<Ornament class="-top-1 -right-1" />
			<Ornament class="-bottom-1 -left-1" />
			<Ornament class="-right-1 -bottom-1" />

			<header class="mb-8 flex flex-col items-center text-center">
				<span
					class="mb-4 flex size-16 rotate-45 items-center justify-center border border-gold-600 bg-linear-to-br from-primary-800 to-primary-950 shadow-lg shadow-black/60"
					aria-hidden="true"
				>
					<span
						class="size-9 -rotate-45 bg-gold-200 mask-contain mask-center mask-no-repeat"
						style:mask-image={`url("${logo}")`}
					></span>
				</span>
				<h1 class="text-3xl font-bold tracking-tight text-gold-100">{title}</h1>
				<p class="mt-1 text-muted-foreground">{description}</p>
			</header>

			{@render children()}

			{#if footer}
				<div class="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
</div>

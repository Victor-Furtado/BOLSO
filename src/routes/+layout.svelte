<script lang="ts">
	import './layout.css';
	import Logo from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';

	let { children } = $props();
	let isMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-slate-50">
	<header class="border-b border-slate-200 bg-white">
		<div
			class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
		>
			<div class="flex items-center justify-between gap-3 lg:flex-1">
				<div class="flex items-center gap-3">
					<img src={Logo} alt="SABRE Logo" class="h-12 w-auto sm:h-14" />
					<div class="space-y-1">
						<h1 class="text-lg font-semibold text-slate-900">RPG de Bolso</h1>
					</div>
				</div>
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 lg:hidden"
					aria-expanded={isMenuOpen}
					aria-label="Abrir menu"
					onclick={() => (isMenuOpen = !isMenuOpen)}
				>
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					>
						<path d="M4 6h16" />
						<path d="M4 12h16" />
						<path d="M4 18h16" />
					</svg>
				</button>
			</div>
			<div
				class={`flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:justify-end ${
					isMenuOpen ? 'flex' : 'hidden lg:flex'
				}`}
			>
				<nav class="flex flex-wrap items-center gap-2">
					<a class="">Entrar</a>
				</nav>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
		{@render children()}
	</main>
</div>

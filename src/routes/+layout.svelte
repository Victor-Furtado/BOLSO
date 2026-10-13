<script lang="ts">
	import '@fontsource/alegreya-sans/400.css';
	import '@fontsource/alegreya-sans/500.css';
	import '@fontsource/alegreya-sans/700.css';
	import '@fontsource/cinzel-decorative/700.css';
	import '@fontsource-variable/eczar';
	import './layout.css';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import logo from '$lib/assets/logo.svg';
	import { cn } from '$lib/utils/ui';
	import { Toaster } from 'svelte-sonner';
	import { House, LogIn, LogOut, Menu, ScrollText, Users, X } from 'lucide-svelte';

	let { data, children } = $props();

	const navItems = $derived(
		[
			{ href: resolve('/'), label: 'Home', icon: House, min: 0 },
			{ href: resolve('/char-gen'), label: 'Criador de Personagens', icon: ScrollText, min: 2 },
			{ href: resolve('/usuarios'), label: 'Usuários', icon: Users, min: 0, admin: true },
			...(data.account ? [] : [{ href: resolve('/login'), label: 'Entrar', icon: LogIn, min: 0 }])
		].filter((item) => data.access >= item.min && (!('admin' in item) || data.admin))
	);

	let menuOpen = $state(false);

	afterNavigate(() => {
		menuOpen = false;
	});

	function isActive(href: string) {
		return href === resolve('/') ? page.url.pathname === href : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Bolso · RPG</title>
</svelte:head>

<div class="flex min-h-dvh flex-col bg-background text-foreground antialiased">
	<header class="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
		<div class="h-0.5 bg-linear-to-r from-primary-900 via-gold-300 to-primary-900"></div>

		<div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
			<a
				href={resolve('/')}
				class="flex items-center gap-2 rounded-md text-gold-200 transition-colors outline-none hover:text-gold-100 focus-visible:ring-2 focus-visible:ring-ring"
			>
				<span
					class="size-8 shrink-0 bg-current mask-contain mask-center mask-no-repeat"
					style:mask-image={`url("${logo}")`}
					aria-hidden="true"
				></span>
				<span class="font-logo text-lg leading-none font-bold sm:text-xl">RPG de Bolso</span>
			</a>

			<nav aria-label="Main" class="hidden md:block">
				<ul class="flex items-center gap-1">
					{#each navItems as item (item.href)}
						<li>
							<a
								href={item.href}
								aria-current={isActive(item.href) ? 'page' : undefined}
								class={cn(
									'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
									isActive(item.href) && 'bg-primary-900/60 text-gold-100'
								)}
							>
								<item.icon class="size-4" />
								{item.label}
							</a>
						</li>
					{/each}
					{#if data.account}
						<li>
							<form method="POST" action="{resolve('/login')}?/logout">
								<button
									type="submit"
									class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
								>
									<LogOut class="size-4" aria-hidden="true" />
									Sair
								</button>
							</form>
						</li>
					{/if}
				</ul>
			</nav>

			<button
				type="button"
				class="-mr-2 inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:hidden"
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				aria-controls="mobile-nav"
				onclick={() => (menuOpen = !menuOpen)}
			>
				{#if menuOpen}
					<X class="size-5" />
				{:else}
					<Menu class="size-5" />
				{/if}
			</button>
		</div>

		{#if menuOpen}
			<nav id="mobile-nav" aria-label="Main" class="border-t border-border bg-surface md:hidden">
				<ul class="flex flex-col gap-1 p-2">
					{#each navItems as item (item.href)}
						<li>
							<a
								href={item.href}
								aria-current={isActive(item.href) ? 'page' : undefined}
								class={cn(
									'flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
									isActive(item.href) && 'bg-primary-900/60 text-gold-100'
								)}
							>
								<item.icon class="size-5" />
								{item.label}
							</a>
						</li>
					{/each}
					{#if data.account}
						<li>
							<form method="POST" action="{resolve('/login')}?/logout">
								<button
									type="submit"
									class="flex w-full items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
								>
									<LogOut class="size-5" aria-hidden="true" />
									Sair
								</button>
							</form>
						</li>
					{/if}
				</ul>
			</nav>
		{/if}
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
		{@render children()}
	</main>

	<footer class="border-t border-border bg-surface">
		<div
			class="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-subtle-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"
		>
			<p>Bolso: um RPG para todos.</p>
			<p>
				Made with 💚 by <a
					href="https://github.com/Victor-Furtado"
					target="_blank"
					class="text-gold-100 hover:underline">Victor Furtado</a
				>.
			</p>
		</div>
	</footer>
	<Toaster theme="dark" richColors position="top-center" duration={4000} />
</div>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { fly } from 'svelte/transition';

	let { data } = $props();

	const openSeats = $derived(data.aliveLimit - data.characters.length);
	const atLimit = $derived(openSeats <= 0);
	const seats = $derived(
		Array.from({ length: data.aliveLimit }, (_, index) => data.characters[index] ?? null)
	);
</script>

<svelte:head>
	<title>Personagens · Bolso</title>
</svelte:head>

<div class="relative mx-auto max-w-3xl">
	<header class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="font-heading text-xs tracking-[0.28em] text-gold-400 uppercase">Companhia</p>
			<h1 class="font-heading text-4xl text-gold-100 sm:text-5xl">Rol dos vivos</h1>
			<p class="mt-2 max-w-md text-sm text-muted-foreground">
				Dez nomes cabem na mesa. Um lugar vago é a única porta para um herói novo.
			</p>
		</div>
		<p class="font-logo text-7xl leading-none text-gold-200/80" aria-hidden="true">
			{String(openSeats).padStart(2, '0')}
		</p>
	</header>

	{#if atLimit}
		<p
			role="status"
			class="mb-6 border-l-2 border-gold-400 bg-primary-950/50 px-4 py-3 text-sm text-gold-100"
		>
			Os dez lugares estão ocupados. O criador fica fechado até um personagem deixar de estar vivo.
		</p>
	{:else}
		<a
			href={resolve('/char-gen')}
			class="mb-6 inline-flex items-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary-950/50 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring"
		>
			Abrir o criador
		</a>
	{/if}

	<ol class="flex flex-col">
		{#each seats as seat, index (seat?.id ?? `vago-${index}`)}
			<li
				in:fly={{ y: 12, duration: 280, delay: index * 35 }}
				class="group relative border-b border-gold-900/50 py-4 motion-reduce:animate-none"
			>
				{#if seat}
					<div class="flex items-center gap-4">
						<span class="w-8 shrink-0 font-logo text-sm text-gold-400" aria-hidden="true">
							{String(index + 1).padStart(2, '0')}
						</span>
						{#if seat.portrait}
							<img
								src={seat.portrait}
								alt=""
								class="size-14 shrink-0 rounded-full object-cover ring-2 ring-gold-600/70 ring-offset-2 ring-offset-background"
							/>
						{:else}
							<span
								class="flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-gold-800 font-heading text-lg text-gold-500"
								aria-hidden="true"
							>
								{seat.name.charAt(0).toUpperCase()}
							</span>
						{/if}
						<div class="min-w-0">
							<p class="font-heading text-2xl text-gold-100">{seat.name}</p>
							<p class="text-sm text-muted-foreground">
								{seat.subtitle}
								<span class="text-subtle-foreground"> · nível {seat.level}</span>
							</p>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-4 text-subtle-foreground">
						<span class="w-8 shrink-0 font-logo text-sm" aria-hidden="true">
							{String(index + 1).padStart(2, '0')}
						</span>
						<span
							class="size-14 shrink-0 rounded-full border border-dashed border-gold-900/80"
							aria-hidden="true"
						></span>
						<p class="font-heading text-xl tracking-wide italic">Lugar vago</p>
					</div>
				{/if}
			</li>
		{/each}
	</ol>
</div>

<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { invalidateAll } from '$app/navigation';
	import { createEmptyAncestryChoice } from '$lib/char-gen/ancestry';
	import { createEmptyBackgroundChoice } from '$lib/char-gen/background';
	import { createEmptyBasicInfo } from '$lib/char-gen/basic-info';
	import { createEmptyFinalTouches, resolveSelections } from '$lib/char-gen/build';
	import { createEmptyClassChoice } from '$lib/char-gen/class';
	import AncestrySkeleton from '$lib/components/char-gen/ancestry-skeleton.svelte';
	import AncestryStep from '$lib/components/char-gen/ancestry-step.svelte';
	import BackgroundSkeleton from '$lib/components/char-gen/background-skeleton.svelte';
	import BackgroundStep from '$lib/components/char-gen/background-step.svelte';
	import BasicInfoForm from '$lib/components/char-gen/basic-info-form.svelte';
	import ClassSkeleton from '$lib/components/char-gen/class-skeleton.svelte';
	import ClassStep from '$lib/components/char-gen/class-step.svelte';
	import FinalTouchesStep from '$lib/components/char-gen/final-touches-step.svelte';
	import SummaryStep from '$lib/components/char-gen/summary-step.svelte';
	import Ornament from '$lib/components/ui/ornament.svelte';
	import { toast } from 'svelte-sonner';
	import { CircleAlert, RotateCcw } from 'lucide-svelte';

	let { data, form } = $props();

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.saved) toast.success(`${form.saved} entrou na lista.`);
	});

	const tabs = [
		{
			value: 'basic-info',
			label: 'Dados Básicos',
			numeral: 'I',
			description: 'Quem era seu herói antes da primeira aventura?'
		},
		{
			value: 'ancestries',
			label: 'Ancestralidade',
			numeral: 'II',
			description: 'De que povo e linhagem seu herói descende?'
		},
		{
			value: 'background',
			label: 'Antecedente',
			numeral: 'III',
			description: 'O que seu herói fazia antes de partir em aventuras?'
		},
		{
			value: 'class',
			label: 'Classe',
			numeral: 'IV',
			description: 'Que vocação guia seu herói nas aventuras?'
		},
		{
			value: 'final-touches',
			label: 'Toques finais',
			numeral: 'V',
			description: 'Distribua os atributos, treine perícias e escolha os talentos de 1º nível.'
		},
		{
			value: 'summary',
			label: 'Resumo',
			numeral: 'VI',
			description: 'Seu herói no 1º nível, pronto para a primeira aventura.'
		}
	];

	let activeTab = $state(tabs[0].value);
	let tabsRoot = $state<HTMLDivElement | null>(null);
	let tabsList = $state<HTMLDivElement | null>(null);
	let basicInfo = $state(createEmptyBasicInfo());
	let ancestryChoice = $state(createEmptyAncestryChoice());
	let backgroundChoice = $state(createEmptyBackgroundChoice());
	let classChoice = $state(createEmptyClassChoice());
	let finalTouches = $state(createEmptyFinalTouches());

	const catalogs = $derived(
		Promise.all([
			data.ancestryCatalog,
			data.backgroundCatalog,
			data.classCatalog,
			data.featCatalog
		]).then(([ancestry, background, classCatalog, feats]) => ({
			ancestry,
			background,
			class: classCatalog,
			feats
		}))
	);

	$effect(() => {
		const trigger = tabsList?.querySelector<HTMLElement>(`[data-value="${activeTab}"]`);
		if (!tabsList || !trigger) return;
		tabsList.scrollTo({
			left: trigger.offsetLeft - (tabsList.clientWidth - trigger.offsetWidth) / 2,
			behavior: 'smooth'
		});
	});

	function goToTab(value: string) {
		activeTab = value;
		tabsRoot?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

{#snippet loadError(subject: string)}
	<div
		role="alert"
		class="flex flex-col items-center gap-3 rounded-lg border border-danger/40 bg-danger/10 px-6 py-10 text-center"
	>
		<CircleAlert class="size-8 text-danger" strokeWidth={1.5} />
		<p class="font-heading text-lg text-gold-100">Não foi possível carregar {subject}</p>
		<p class="text-sm text-muted-foreground">
			O catálogo não respondeu. Verifique a conexão e tente de novo.
		</p>
		<button
			type="button"
			onclick={() => invalidateAll()}
			class="mt-1 inline-flex items-center gap-2 rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring"
		>
			<RotateCcw class="size-4" />
			Tentar de novo
		</button>
	</div>
{/snippet}

<svelte:head>
	<title>Criar Personagem · Bolso</title>
</svelte:head>

<Tabs.Root bind:value={activeTab} bind:ref={tabsRoot} class="w-full scroll-mt-20">
	<Tabs.List
		bind:ref={tabsList}
		class="relative z-10 -mb-px flex [scrollbar-width:none] items-end gap-1 overflow-x-auto px-2 sm:gap-2 sm:px-5"
	>
		{#each tabs as tab (tab.value)}
			<Tabs.Trigger
				value={tab.value}
				data-value={tab.value}
				class="group relative mb-px flex min-w-fit flex-1 items-center justify-center gap-3 rounded-t-lg border border-b-0 border-border bg-surface-raised/50 px-4 pt-2.5 pb-2.5 text-muted-foreground transition-[color,background-color,padding] duration-200 outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[state=active]:mb-0 data-[state=active]:border-border-strong data-[state=active]:bg-surface data-[state=active]:pt-3.5 data-[state=active]:text-gold-100 sm:flex-none sm:px-6"
			>
				<span
					aria-hidden="true"
					class="absolute inset-x-3 top-0 h-0.5 bg-linear-to-r from-transparent via-gold-300 to-transparent opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"
				></span>
				<span
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 rounded-t-lg bg-radial-[at_50%_0%] from-primary-700/35 to-transparent to-70% opacity-0 transition-opacity duration-200 group-data-[state=active]:opacity-100"
				></span>

				<span
					aria-hidden="true"
					class="relative flex size-6 shrink-0 rotate-45 items-center justify-center border border-border-strong bg-background transition-colors duration-200 group-data-[state=active]:border-gold-400 group-data-[state=active]:bg-primary-800"
				>
					<span class="-rotate-45 font-logo text-[0.6rem] leading-none font-bold">
						{tab.numeral}
					</span>
				</span>
				<span class="relative font-heading text-base font-medium whitespace-nowrap sm:text-lg">
					{tab.label}
				</span>
			</Tabs.Trigger>
		{/each}
	</Tabs.List>

	{#each tabs as tab (tab.value)}
		<Tabs.Content
			value={tab.value}
			class="rounded-xl border border-border-strong bg-surface p-1.5 shadow-2xl shadow-black/50 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-2"
		>
			<div
				class="relative min-h-[60dvh] rounded-lg border border-gold-800 bg-radial-[at_50%_0%] from-primary-950/60 via-surface to-surface px-4 py-6 sm:px-10 sm:py-10"
			>
				<div
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
				>
					<span
						class="absolute -right-4 -bottom-16 font-logo text-[12rem] leading-none font-bold text-gold-200/4 select-none sm:-bottom-24 sm:text-[18rem]"
					>
						{tab.numeral}
					</span>
				</div>

				<Ornament class="-top-1 -left-1" />
				<Ornament class="-top-1 -right-1" />
				<Ornament class="-bottom-1 -left-1" />
				<Ornament class="-right-1 -bottom-1" />

				<div class="relative">
					<header class="mb-8 animate-page-in motion-reduce:animate-none sm:mb-10">
						<h1 class="text-3xl font-bold tracking-tight text-gold-100 sm:text-4xl">
							{tab.label}
						</h1>
						<p class="mt-1 text-muted-foreground">{tab.description}</p>
					</header>

					{#if tab.value === 'basic-info'}
						<BasicInfoForm bind:value={basicInfo} onnext={() => goToTab('ancestries')} />
					{:else if tab.value === 'ancestries'}
						{#await data.ancestryCatalog}
							<AncestrySkeleton />
						{:then catalog}
							<AncestryStep
								{catalog}
								bind:value={ancestryChoice}
								characterName={basicInfo.name}
								onnext={() => goToTab('background')}
							/>
						{:catch}
							{@render loadError('as ancestralidades')}
						{/await}
					{:else if tab.value === 'background'}
						{#await data.backgroundCatalog}
							<BackgroundSkeleton />
						{:then catalog}
							<BackgroundStep
								{catalog}
								bind:value={backgroundChoice}
								characterName={basicInfo.name}
								onnext={() => goToTab('class')}
							/>
						{:catch}
							{@render loadError('os antecedentes')}
						{/await}
					{:else if tab.value === 'class'}
						{#await data.classCatalog}
							<ClassSkeleton />
						{:then catalog}
							<ClassStep
								{catalog}
								bind:value={classChoice}
								characterName={basicInfo.name}
								onnext={() => goToTab('final-touches')}
							/>
						{:catch}
							{@render loadError('as classes')}
						{/await}
					{:else if tab.value === 'final-touches' || tab.value === 'summary'}
						{#await catalogs}
							<div
								role="status"
								aria-label="Carregando"
								class="h-96 animate-pulse rounded-lg border border-border bg-surface-raised"
							></div>
						{:then loaded}
							{@const selections = resolveSelections(loaded, {
								ancestry: ancestryChoice,
								background: backgroundChoice,
								class: classChoice
							})}
							{#if tab.value === 'final-touches'}
								<FinalTouchesStep
									{selections}
									feats={loaded.feats}
									bind:value={finalTouches}
									ongoto={goToTab}
									onnext={() => goToTab('summary')}
								/>
							{:else}
								<SummaryStep
									{basicInfo}
									{selections}
									feats={loaded.feats}
									touches={finalTouches}
									atLimit={data.characters.length >= data.aliveLimit}
									ongoto={goToTab}
								/>
							{/if}
						{:catch}
							{@render loadError('o catálogo')}
						{/await}
					{/if}
				</div>
			</div>
		</Tabs.Content>
	{/each}
</Tabs.Root>

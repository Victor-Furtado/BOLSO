<script lang="ts">
	import {
		MOTTO_MAX_LENGTH,
		formerOccupationSuggestions,
		type BasicInfo
	} from '$lib/char-gen/basic-info';
	import { rollMotto, rollName, rollNickname } from '$lib/char-gen/random-tables';
	import FormField, { inputClass } from '$lib/components/ui/form-field.svelte';
	import FormSection from '$lib/components/ui/form-section.svelte';
	import MeasureField from '$lib/components/ui/measure-field.svelte';
	import RollButton from '$lib/components/ui/roll-button.svelte';
	import { cn } from '$lib/utils/ui';
	import { ArrowRight } from 'lucide-svelte';
	import PortraitUpload from './portrait-upload.svelte';

	type Props = {
		value: BasicInfo;
		onnext?: () => void;
	};

	let { value = $bindable(), onnext }: Props = $props();

	const id = $props.id();
	const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

	const heightHint = $derived.by(() => {
		if (!value.heightCm) return 'Em centímetros';
		const totalInches = Math.round(value.heightCm / 2.54);
		return `${decimal.format(value.heightCm / 100)} m · ${Math.floor(totalInches / 12)}′${totalInches % 12}″`;
	});

	const weightHint = $derived(
		value.weightKg ? `≈ ${Math.round(value.weightKg * 2.20462)} lb` : 'Em quilos'
	);

	const portraitAlt = $derived(value.name ? `Retrato de ${value.name}` : 'Retrato do personagem');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		onnext?.();
	}
</script>

<form
	onsubmit={handleSubmit}
	class="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14"
	aria-label="Dados básicos do personagem"
>
	<aside
		class="flex animate-page-in flex-col items-center motion-reduce:animate-none lg:sticky lg:top-24 lg:self-start"
	>
		<PortraitUpload bind:value={value.portrait} alt={portraitAlt}>
			<div
				aria-hidden="true"
				class="relative -mt-1 w-full max-w-56 border border-gold-700 bg-linear-to-b from-gold-800/50 to-gold-900/80 px-4 py-3 text-center shadow-lg shadow-black/50 sm:max-w-64"
			>
				<p
					class={cn(
						'truncate font-heading text-lg leading-tight font-semibold',
						value.name ? 'text-gold-100' : 'text-subtle-foreground italic'
					)}
				>
					{value.name || 'Herói sem nome'}
				</p>
				{#if value.nickname}
					<p class="mt-0.5 truncate text-sm text-gold-300 italic">“{value.nickname}”</p>
				{/if}
				{#if value.motto}
					<p
						class="mt-2 border-t border-gold-700/60 pt-2 text-sm leading-snug text-muted-foreground italic"
					>
						{value.motto}
					</p>
				{/if}
			</div>
		</PortraitUpload>
	</aside>

	<div class="flex min-w-0 flex-col gap-10">
		<FormSection
			title="Identidade"
			description="Quem é seu herói e como o mundo o conhece."
			class="animate-page-in [animation-delay:80ms] motion-reduce:animate-none"
		>
			<div class="grid gap-5 sm:grid-cols-2">
				<FormField id="{id}-name" label="Nome do personagem" required>
					<div class="relative">
						<input
							id="{id}-name"
							bind:value={value.name}
							required
							maxlength="60"
							autocomplete="off"
							placeholder="ex.: Seelah Montvarre"
							class={cn(inputClass, 'pr-12')}
						/>
						<RollButton
							label="Rolar um nome aleatório"
							onroll={() => (value.name = rollName(value.name))}
							class="absolute top-1/2 right-1 -translate-y-1/2"
						/>
					</div>
				</FormField>

				<FormField id="{id}-nickname" label="Alcunha" hint="Como as tavernas falam de você.">
					<div class="relative">
						<input
							id="{id}-nickname"
							bind:value={value.nickname}
							maxlength="40"
							autocomplete="off"
							placeholder="ex.: a Lâmina de Absalom"
							aria-describedby="{id}-nickname-hint"
							class={cn(inputClass, 'pr-12')}
						/>
						<RollButton
							label="Rolar uma alcunha aleatória"
							onroll={() => (value.nickname = rollNickname(value.nickname))}
							class="absolute top-1/2 right-1 -translate-y-1/2"
						/>
					</div>
				</FormField>

				<FormField
					id="{id}-occupation"
					label="Ofício anterior"
					hint="O que você fazia antes de largar tudo pela estrada."
					class="sm:col-span-2"
				>
					<input
						id="{id}-occupation"
						bind:value={value.formerOccupation}
						list="{id}-occupations"
						maxlength="60"
						autocomplete="off"
						placeholder="ex.: Ferreiro, escriba, contrabandista…"
						aria-describedby="{id}-occupation-hint"
						class={inputClass}
					/>
					<datalist id="{id}-occupations">
						{#each formerOccupationSuggestions as occupation (occupation)}
							<option value={occupation}></option>
						{/each}
					</datalist>
				</FormField>

				<FormField id="{id}-motto" label="Lema" class="sm:col-span-2">
					{#snippet aside()}
						<span class={cn(value.motto.length >= MOTTO_MAX_LENGTH && 'text-warning')}>
							{value.motto.length}/{MOTTO_MAX_LENGTH}
						</span>
					{/snippet}
					<div class="relative">
						<textarea
							id="{id}-motto"
							bind:value={value.motto}
							rows="2"
							maxlength={MOTTO_MAX_LENGTH}
							placeholder="ex.: Nenhuma porta resiste a quem bate duas vezes."
							class={cn(inputClass, 'resize-none pr-12 font-heading italic')}></textarea>
						<RollButton
							label="Rolar um lema aleatório"
							onroll={() => (value.motto = rollMotto(value.motto))}
							class="absolute top-1 right-1"
						/>
					</div>
				</FormField>
			</div>
		</FormSection>

		<FormSection
			title="Físico"
			description="Medidas variam muito entre ancestralidades: um gnomo e um orc não dividem roupas."
			class="animate-page-in [animation-delay:160ms] motion-reduce:animate-none"
		>
			<div class="grid grid-cols-2 gap-5 sm:grid-cols-3">
				<MeasureField
					bind:value={value.heightCm}
					label="Altura"
					suffix="cm"
					unitName="centímetros"
					placeholder="175"
					min={1}
					max={999}
					hint={heightHint}
				/>
				<MeasureField
					bind:value={value.weightKg}
					label="Peso"
					suffix="kg"
					unitName="quilos"
					placeholder="70"
					min={1}
					max={9999}
					step={0.1}
					hint={weightHint}
				/>
				<MeasureField
					bind:value={value.age}
					label="Idade"
					suffix="anos"
					unitName="anos"
					placeholder="25"
					min={0}
					max={9999}
					hint="Elfos passam dos 600."
					class="col-span-2 sm:col-span-1"
				/>
			</div>
		</FormSection>

		<div
			class="flex animate-page-in flex-col-reverse gap-3 border-t border-border pt-6 [animation-delay:240ms] motion-reduce:animate-none sm:flex-row sm:items-center sm:justify-between"
		>
			<p class="text-xs text-subtle-foreground">
				<span class="text-primary-400" aria-hidden="true">*</span> Campo obrigatório
			</p>
			<button
				type="submit"
				class="group inline-flex w-full items-center justify-center gap-2 rounded-md border border-gold-600/60 bg-primary-700 px-5 py-3 font-heading text-base font-semibold text-primary-foreground shadow-lg shadow-primary-950/60 transition-colors outline-none hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-px sm:w-auto"
			>
				Próximo: Ancestralidade
				<ArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
			</button>
		</div>
	</div>
</form>

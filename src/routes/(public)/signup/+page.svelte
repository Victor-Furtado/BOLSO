<script lang="ts">
	import { resolve } from '$app/paths';
	import AuthCard, { linkClass, submitButtonClass } from '$lib/components/auth/auth-card.svelte';
	import PasswordInput from '$lib/components/auth/password-input.svelte';
	import FormField, { inputClass } from '$lib/components/ui/form-field.svelte';
	import { Info, UserPlus } from 'lucide-svelte';

	const PASSWORD_MIN_LENGTH = 8;

	const id = $props.id();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmation = $state('');
	let confirmationRef = $state<HTMLInputElement | null>(null);
	let confirmationTouched = $state(false);
	let submitted = $state(false);

	const mismatch = $derived(confirmation !== '' && confirmation !== password);
	const showMismatch = $derived(mismatch && confirmationTouched);

	$effect(() => {
		confirmationRef?.setCustomValidity(mismatch ? 'As senhas não coincidem.' : '');
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
	}
</script>

<svelte:head>
	<title>Criar conta · Bolso</title>
</svelte:head>

<AuthCard title="Criar conta" description="Junte-se à mesa e guarde seus heróis.">
	<form method="POST" onsubmit={handleSubmit} class="flex flex-col gap-5">
		<FormField id="{id}-name" label="Nome" required>
			<input
				id="{id}-name"
				name="name"
				bind:value={name}
				required
				maxlength={60}
				autocomplete="name"
				placeholder="Como devemos te chamar?"
				class={inputClass}
			/>
		</FormField>

		<FormField id="{id}-email" label="E-mail" required>
			<input
				id="{id}-email"
				name="email"
				type="email"
				bind:value={email}
				required
				autocomplete="email"
				inputmode="email"
				placeholder="voce@exemplo.com"
				class={inputClass}
			/>
		</FormField>

		<FormField
			id="{id}-password"
			label="Senha"
			required
			hint="Mínimo de {PASSWORD_MIN_LENGTH} caracteres."
		>
			<PasswordInput
				id="{id}-password"
				name="password"
				bind:value={password}
				required
				minlength={PASSWORD_MIN_LENGTH}
				autocomplete="new-password"
				aria-describedby="{id}-password-hint"
			/>
		</FormField>

		<FormField id="{id}-confirmation" label="Confirmar senha" required>
			<PasswordInput
				id="{id}-confirmation"
				bind:value={confirmation}
				bind:ref={confirmationRef}
				required
				autocomplete="new-password"
				onblur={() => (confirmationTouched = true)}
				aria-invalid={showMismatch || undefined}
				aria-describedby={showMismatch ? `${id}-confirmation-error` : undefined}
			/>
			{#if showMismatch}
				<p id="{id}-confirmation-error" class="text-xs text-danger">As senhas não coincidem.</p>
			{/if}
		</FormField>

		{#if submitted}
			<p
				role="status"
				class="flex items-start gap-2 rounded-md border border-info/40 bg-info/10 px-3 py-2.5 text-sm text-foreground"
			>
				<Info class="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
				O cadastro ainda não está disponível. Em breve você poderá criar sua conta por aqui.
			</p>
		{/if}

		<button type="submit" class={submitButtonClass}>
			<UserPlus class="size-4" aria-hidden="true" />
			Criar conta
		</button>
	</form>

	{#snippet footer()}
		Já tem uma conta? <a href={resolve('/login')} class={linkClass}>Entrar</a>
	{/snippet}
</AuthCard>

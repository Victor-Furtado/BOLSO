<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthCard, { linkClass, submitButtonClass } from '$lib/components/auth/auth-card.svelte';
	import PasswordInput from '$lib/components/auth/password-input.svelte';
	import FormField, { inputClass } from '$lib/components/ui/form-field.svelte';
	import SubmitButton from '$lib/components/ui/submit-button.svelte';
	import { toast } from 'svelte-sonner';

	let { form } = $props();

	$effect(() => {
		if (form?.message) toast.error(form.message);
	});

	const id = $props.id();
	let password = $state('');
	let pending = $state(false);
</script>

<svelte:head>
	<title>Criar conta · Bolso</title>
</svelte:head>

<AuthCard title="Criar conta" description="O cadastro aberto usa a senha temporária da mesa.">
	<form
		method="POST"
		class="flex flex-col gap-5"
		use:enhance={() => {
			pending = true;
			return async ({ update }) => {
				try {
					await update();
				} finally {
					pending = false;
				}
			};
		}}
	>
		<fieldset disabled={pending} class="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
			<FormField id="{id}-name" label="Nome">
				<input
					id="{id}-name"
					name="name"
					required
					maxlength="80"
					autocomplete="name"
					class={inputClass}
				/>
			</FormField>
			<FormField id="{id}-email" label="E-mail">
				<input
					id="{id}-email"
					name="email"
					type="email"
					value={form?.email ?? ''}
					required
					autocomplete="email"
					class={inputClass}
				/>
			</FormField>
			<FormField id="{id}-password" label="Senha temporária">
				<PasswordInput
					id="{id}-password"
					name="password"
					bind:value={password}
					required
					autocomplete="new-password"
				/>
			</FormField>
			<SubmitButton {pending} class={submitButtonClass}>Criar conta</SubmitButton>
		</fieldset>
	</form>

	{#snippet footer()}
		Já tem uma conta? <a href={resolve('/login')} class={linkClass}>Entrar</a>
	{/snippet}
</AuthCard>

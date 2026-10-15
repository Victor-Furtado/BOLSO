<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthCard, { linkClass, submitButtonClass } from '$lib/components/auth/auth-card.svelte';
	import PasswordInput from '$lib/components/auth/password-input.svelte';
	import FormField, { inputClass } from '$lib/components/ui/form-field.svelte';
	import SubmitButton from '$lib/components/ui/submit-button.svelte';
	import { toast } from 'svelte-sonner';
	import { LogIn } from 'lucide-svelte';

	let { form } = $props();

	$effect(() => {
		if (form?.message) toast.error(form.message);
	});

	const id = $props.id();
	let password = $state('');
	let pending = $state(false);
</script>

<svelte:head>
	<title>Entrar · Bolso</title>
</svelte:head>

<AuthCard title="Bem-vindo de volta" description="Entre para continuar suas aventuras.">
	<form
		method="POST"
		action="?/login"
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
			<FormField id="{id}-email" label="E-mail">
				<input
					id="{id}-email"
					name="email"
					type="email"
					value={form?.email ?? ''}
					required
					autocomplete="email"
					inputmode="email"
					placeholder="voce@exemplo.com"
					class={inputClass}
				/>
			</FormField>

			<FormField id="{id}-password" label="Senha">
				<PasswordInput
					id="{id}-password"
					name="password"
					bind:value={password}
					required
					minlength={1}
					autocomplete="current-password"
				/>
			</FormField>

			<label class="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
				<input
					type="checkbox"
					name="remember"
					checked
					class="size-4 rounded border-border-strong bg-input text-primary-600 focus:ring-gold-500/40 focus:ring-offset-surface"
				/>
				Manter conectado
			</label>

			<SubmitButton {pending} class={submitButtonClass}>
				<LogIn class="size-4" aria-hidden="true" />
				Entrar
			</SubmitButton>
		</fieldset>
	</form>

	{#snippet footer()}
		Ainda não tem conta? <a href={resolve('/signup')} class={linkClass}>Criar conta</a>
	{/snippet}
</AuthCard>

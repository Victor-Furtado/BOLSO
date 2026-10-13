<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import AuthCard, { linkClass, submitButtonClass } from '$lib/components/auth/auth-card.svelte';
	import PasswordInput from '$lib/components/auth/password-input.svelte';
	import FormField, { inputClass } from '$lib/components/ui/form-field.svelte';
	import { CircleAlert, LogIn } from 'lucide-svelte';

	let { form } = $props();

	const id = $props.id();
	let password = $state('');
</script>

<svelte:head>
	<title>Entrar · Bolso</title>
</svelte:head>

<AuthCard title="Bem-vindo de volta" description="Entre para continuar suas aventuras.">
	<form method="POST" action="?/login" use:enhance class="flex flex-col gap-5">
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

		{#if form?.message}
			<p
				role="alert"
				class="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-foreground"
			>
				<CircleAlert class="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
				{form.message}
			</p>
		{/if}

		<button type="submit" class={submitButtonClass}>
			<LogIn class="size-4" aria-hidden="true" />
			Entrar
		</button>
	</form>

	{#snippet footer()}
		Ainda não tem conta? <a href={resolve('/signup')} class={linkClass}>Criar conta</a>
	{/snippet}
</AuthCard>

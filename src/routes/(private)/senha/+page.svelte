<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthCard, { submitButtonClass } from '$lib/components/auth/auth-card.svelte';
	import PasswordInput from '$lib/components/auth/password-input.svelte';
	import FormField from '$lib/components/ui/form-field.svelte';
	import SubmitButton from '$lib/components/ui/submit-button.svelte';
	import { toast } from 'svelte-sonner';
	import { KeyRound } from 'lucide-svelte';

	let { data, form } = $props();

	$effect(() => {
		if (form?.message) toast.error(form.message);
	});

	const id = $props.id();
	let current = $state('');
	let next = $state('');
	let confirm = $state('');
	let pending = $state(false);
</script>

<svelte:head>
	<title>Nova senha · Bolso</title>
</svelte:head>

<AuthCard
	title="Troque sua senha"
	description={data.invited
		? 'Escolha uma senha para entrar. Até salvar, o Bolso fica nesta página.'
		: 'Escolha uma senha nova para continuar.'}
>
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
			{#if form?.message}
				<p role="alert" class="text-sm text-danger">{form.message}</p>
			{/if}
			{#if !data.invited}
				<FormField id="{id}-current" label="Senha atual">
					<PasswordInput
						id="{id}-current"
						name="current"
						bind:value={current}
						required
						autocomplete="current-password"
					/>
				</FormField>
			{/if}
			<FormField id="{id}-next" label="Nova senha">
				<PasswordInput
					id="{id}-next"
					name="next"
					bind:value={next}
					required
					minlength={data.min}
					autocomplete="new-password"
				/>
			</FormField>
			<FormField id="{id}-confirm" label="Confirmar nova senha">
				<PasswordInput
					id="{id}-confirm"
					name="confirm"
					bind:value={confirm}
					required
					minlength={data.min}
					autocomplete="new-password"
				/>
			</FormField>
			<SubmitButton {pending} class={submitButtonClass}>
				<KeyRound class="size-4" aria-hidden="true" />
				Salvar senha
			</SubmitButton>
		</fieldset>
	</form>
</AuthCard>

<script lang="ts">
	import { resolve } from '$app/paths';
	import AuthCard, { linkClass } from '$lib/components/auth/auth-card.svelte';
	import { Info } from 'lucide-svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Criar conta · Bolso</title>
</svelte:head>

<AuthCard title="Criar conta" description="O cadastro está fechado por enquanto.">
	<form method="POST" class="flex flex-col gap-5">
		<p
			role="status"
			class="flex items-start gap-2 rounded-md border border-info/40 bg-info/10 px-3 py-2.5 text-sm text-foreground"
		>
			<Info class="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
			{form?.message ?? 'Novas contas não estão sendo abertas. Peça um convite ao mestre.'}
		</p>
		<button type="submit" disabled class="sr-only">Criar conta</button>
	</form>

	{#snippet footer()}
		Já tem uma conta? <a href={resolve('/login')} class={linkClass}>Entrar</a>
	{/snippet}
</AuthCard>

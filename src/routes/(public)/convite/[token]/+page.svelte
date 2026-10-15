<script lang="ts">
	import AuthCard from '$lib/components/auth/auth-card.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Convite · Bolso</title>
</svelte:head>

{#if data.invalid}
	<AuthCard title="Convite inválido" description="Este link expirou ou já foi usado.">
		<p class="text-sm text-muted-foreground">Peça um novo convite ao administrador.</p>
	</AuthCard>
{/if}

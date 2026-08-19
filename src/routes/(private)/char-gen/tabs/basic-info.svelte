<script lang="ts">
	import { Upload } from 'lucide-svelte';

	type basicInfo = {
		nome: string;
		alcunha: string;
		origem: string;
		avatarPreview: string;
		citacao: string;
	};

	let { character = $bindable() }: { character: basicInfo } = $props();

	function handleAvatarChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				character.avatarPreview = event.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}
</script>

<div class="rounded-lg border border-slate-800 bg-slate-900 p-6">
	<h2 class="mb-6 text-xl font-semibold text-slate-50">Informações Básicas</h2>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="flex flex-col gap-3">
			<div>
				<label for="nome" class="mb-2 block text-sm font-medium text-slate-300"
					>Nome do Personagem</label
				>
				<input
					id="nome"
					type="text"
					bind:value={character.nome}
					placeholder="Ex: Aragorn, Elara Moonwhisper"
					class="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 placeholder-slate-500 transition-colors focus:border-slate-600 focus:ring-1 focus:ring-slate-600 focus:outline-none"
				/>
			</div>

			<div>
				<label for="alcunha" class="mb-2 block text-sm font-medium text-slate-300"
					>Alcunha / Vulgo</label
				>
				<input
					id="alcunha"
					type="text"
					bind:value={character.alcunha}
					placeholder="Ex: O Ranger, A Maga da Névoa"
					class="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 placeholder-slate-500 transition-colors focus:border-slate-600 focus:ring-1 focus:ring-slate-600 focus:outline-none"
				/>
			</div>

			<div class="sm:col-span-2">
				<label for="origem" class="mb-2 block text-sm font-medium text-slate-300">Origem</label>
				<input
					id="origem"
					type="text"
					bind:value={character.origem}
					placeholder="Ex: Reino de Gondor, Floresta de Mirkwood, Forja dos Anões"
					class="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 placeholder-slate-500 transition-colors focus:border-slate-600 focus:ring-1 focus:ring-slate-600 focus:outline-none"
				/>
			</div>

			<hr />

			<div>
				<label for="citacao" class="mb-2 block text-sm font-medium text-slate-300"
					>Citação ou Frase de Efeito</label
				>
				<span class="mb-2 block text-xs text-slate-400">Uma linha que resume o personagem</span>
				<input
					id="citacao"
					type="text"
					bind:value={character.citacao}
					placeholder="Ex: 'A coragem não é a ausência do medo, é agir apesar dele'"
					class="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 placeholder-slate-500 transition-colors focus:border-slate-600 focus:ring-1 focus:ring-slate-600 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<h2 class="text-xl font-semibold text-slate-50">Avatar</h2>
			<label
				class="hover:bg-slate-750 flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-700 bg-slate-800 p-6 transition-colors hover:border-slate-600"
			>
				<Upload size={20} class="text-slate-400" />
				<span class="text-sm text-slate-400">Clique para selecionar</span>
				<input
					id="avatar"
					type="file"
					accept="image/*"
					onchange={handleAvatarChange}
					class="hidden"
				/>
			</label>
			{#if character.avatarPreview}
				<div>
					<p class="mb-3 block text-sm font-medium text-slate-300">Prévia</p>
					<div
						class="flex items-center justify-center rounded-md border border-slate-700 bg-slate-800 p-4"
					>
						<img
							src={character.avatarPreview}
							alt="Avatar preview"
							class="max-h-48 max-w-48 rounded-md object-cover"
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

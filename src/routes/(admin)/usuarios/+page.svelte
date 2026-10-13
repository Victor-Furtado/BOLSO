<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { inputClass } from '$lib/components/ui/form-field.svelte';
	import { cn } from '$lib/utils/ui';
	import { toast } from 'svelte-sonner';
	import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-svelte';

	type Seat = 'player' | 'gm' | 'admin';

	type UserRow = {
		id: string;
		name: string;
		email: string;
		seat: Seat;
		active: boolean;
	};

	const PAGE_SIZE = 6;
	const seats: { value: Seat; label: string }[] = [
		{ value: 'player', label: 'Jogador' },
		{ value: 'gm', label: 'Mestre' },
		{ value: 'admin', label: 'Admin' }
	];

	const seed: UserRow[] = [
		['Victor Furtado', 'victor@bolso.com', 'admin'],
		['Helena Vargas', 'helena@bolso.com', 'gm'],
		['Caio Mendes', 'caio@bolso.com', 'player'],
		['Lívia Duarte', 'livia@bolso.com', 'player'],
		['Rafael Nunes', 'rafael@bolso.com', 'player'],
		['Marina Costa', 'marina@bolso.com', 'gm'],
		['Otávio Lima', 'otavio@bolso.com', 'player'],
		['Beatriz Rocha', 'beatriz@bolso.com', 'player'],
		['Igor Pacheco', 'igor@bolso.com', 'player'],
		['Sofia Almeida', 'sofia@bolso.com', 'player'],
		['Diego Martins', 'diego@bolso.com', 'gm'],
		['Clara Ferreira', 'clara@bolso.com', 'player'],
		['Bruno Teixeira', 'bruno@bolso.com', 'player'],
		['Ana Bezerra', 'ana@bolso.com', 'player']
	].map(([name, email, seat], index) => ({
		id: `u-${index + 1}`,
		name,
		email,
		seat: seat as Seat,
		active: index !== 9
	}));

	let rows = $state<UserRow[]>(seed);
	let query = $state('');
	let page = $state(1);
	let editing = $state<UserRow | null>(null);
	let draft = $state({ name: '', email: '', seat: 'player' as Seat, active: true });
	let pendingDelete = $state<UserRow | null>(null);
	const filtered = $derived(
		rows.filter((row) => {
			const needle = query.trim().toLowerCase();
			if (!needle) return true;
			return row.name.toLowerCase().includes(needle) || row.email.toLowerCase().includes(needle);
		})
	);
	const pageCount = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	const visible = $derived(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));

	$effect(() => {
		if (page > pageCount) page = pageCount;
	});

	function seatLabel(seat: Seat) {
		return seats.find((item) => item.value === seat)?.label ?? seat;
	}

	function openCreate() {
		editing = { id: '', name: '', email: '', seat: 'player', active: true };
		draft = { name: '', email: '', seat: 'player', active: true };
	}

	function openEdit(row: UserRow) {
		editing = row;
		draft = { name: row.name, email: row.email, seat: row.seat, active: row.active };
	}

	function closeForm() {
		editing = null;
	}

	function saveUser() {
		const name = draft.name.trim();
		const email = draft.email.trim().toLowerCase();
		if (!name || !email.includes('@')) {
			toast.error('Informe um nome e um e-mail válido.');
			return;
		}
		const taken = rows.some((row) => row.email === email && row.id !== editing?.id);
		if (taken) {
			toast.error('Já existe uma conta com esse e-mail.');
			return;
		}
		const created = !editing?.id;
		if (created) {
			rows = [
				{ id: crypto.randomUUID(), name, email, seat: draft.seat, active: draft.active },
				...rows
			];
		} else {
			rows = rows.map((row) =>
				row.id === editing?.id
					? { ...row, name, email, seat: draft.seat, active: draft.active }
					: row
			);
		}
		closeForm();
		toast.success(created ? 'Conta criada.' : 'Conta atualizada.');
	}

	function removeUser() {
		if (!pendingDelete) return;
		const name = pendingDelete.name;
		rows = rows.filter((row) => row.id !== pendingDelete?.id);
		pendingDelete = null;
		toast.success(`${name} foi removida da lista.`);
	}
</script>

<svelte:head>
	<title>Usuários · Bolso</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="font-heading text-xs tracking-[0.22em] text-gold-400 uppercase">Mesa</p>
			<h1 class="font-heading text-3xl text-gold-100">Livro de contas</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{filtered.length}
				{filtered.length === 1 ? 'conta' : 'contas'} neste recorte.
			</p>
		</div>
		<button
			type="button"
			onclick={openCreate}
			class="inline-flex items-center justify-center gap-2 rounded-md bg-primary-700 px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<Plus class="size-4" aria-hidden="true" />
			Nova conta
		</button>
	</header>

	<div class="relative">
		<Search
			class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground"
			aria-hidden="true"
		/>
		<input
			type="search"
			bind:value={query}
			oninput={() => (page = 1)}
			placeholder="Buscar por nome ou e-mail"
			aria-label="Buscar contas"
			class={cn(inputClass, 'pl-9')}
		/>
	</div>

	<div class="overflow-hidden rounded-lg border border-border bg-surface">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[40rem] text-left text-sm">
				<thead
					class="border-b border-border bg-surface-raised text-xs tracking-wide text-subtle-foreground uppercase"
				>
					<tr>
						<th class="px-4 py-3 font-medium">Nome</th>
						<th class="px-4 py-3 font-medium">E-mail</th>
						<th class="px-4 py-3 font-medium">Assento</th>
						<th class="px-4 py-3 font-medium">Estado</th>
						<th class="px-4 py-3 text-right font-medium">Ações</th>
					</tr>
				</thead>
				<tbody>
					{#each visible as row (row.id)}
						<tr class="border-b border-border/70 last:border-0">
							<td class="px-4 py-3 font-medium text-foreground">{row.name}</td>
							<td class="px-4 py-3 text-muted-foreground">{row.email}</td>
							<td class="px-4 py-3">
								<span
									class={cn(
										'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
										row.seat === 'admin' && 'bg-primary-900 text-gold-100',
										row.seat === 'gm' && 'bg-gold-900 text-gold-100',
										row.seat === 'player' && 'bg-muted text-muted-foreground'
									)}
								>
									{seatLabel(row.seat)}
								</span>
							</td>
							<td class="px-4 py-3 text-muted-foreground">{row.active ? 'Ativa' : 'Suspensa'}</td>
							<td class="px-4 py-3">
								<div class="flex justify-end gap-1">
									<button
										type="button"
										onclick={() => openEdit(row)}
										class="rounded-md p-2 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
										aria-label="Editar {row.name}"
									>
										<Pencil class="size-4" />
									</button>
									<button
										type="button"
										onclick={() => (pendingDelete = row)}
										class="rounded-md p-2 text-muted-foreground hover:bg-danger/15 hover:text-danger"
										aria-label="Excluir {row.name}"
									>
										<Trash2 class="size-4" />
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-4 py-10 text-center text-muted-foreground">
								Nenhuma conta encontrada.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div
			class="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground"
		>
			<p>Página {page} de {pageCount}</p>
			<div class="flex gap-1">
				<button
					type="button"
					disabled={page <= 1}
					onclick={() => page--}
					class="rounded-md p-2 hover:bg-surface-hover disabled:opacity-40"
					aria-label="Página anterior"
				>
					<ChevronLeft class="size-4" />
				</button>
				<button
					type="button"
					disabled={page >= pageCount}
					onclick={() => page++}
					class="rounded-md p-2 hover:bg-surface-hover disabled:opacity-40"
					aria-label="Próxima página"
				>
					<ChevronRight class="size-4" />
				</button>
			</div>
		</div>
	</div>
</div>

{#if editing}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
		transition:fade={{ duration: 150 }}
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeForm()}
	>
		<form
			class="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl"
			transition:fly={{ y: 12, duration: 180 }}
			onsubmit={(event) => {
				event.preventDefault();
				saveUser();
			}}
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<h2 class="font-heading text-xl text-gold-100">
					{editing.id ? 'Editar conta' : 'Nova conta'}
				</h2>
				<button
					type="button"
					onclick={closeForm}
					class="rounded-md p-1 text-muted-foreground hover:text-foreground"
					aria-label="Fechar"
				>
					<X class="size-4" />
				</button>
			</div>
			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-1.5 text-sm text-muted-foreground">
					Nome
					<input bind:value={draft.name} required class={inputClass} />
				</label>
				<label class="flex flex-col gap-1.5 text-sm text-muted-foreground">
					E-mail
					<input bind:value={draft.email} type="email" required class={inputClass} />
				</label>
				<label class="flex flex-col gap-1.5 text-sm text-muted-foreground">
					Assento
					<select bind:value={draft.seat} class={inputClass}>
						{#each seats as seat (seat.value)}
							<option value={seat.value}>{seat.label}</option>
						{/each}
					</select>
				</label>
				<label class="flex items-center gap-2 text-sm text-muted-foreground">
					<input
						type="checkbox"
						bind:checked={draft.active}
						class="size-4 rounded border-border-strong bg-input text-primary-600"
					/>
					Conta ativa
				</label>
				<button
					type="submit"
					class="rounded-md bg-primary-700 px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-600"
				>
					Salvar
				</button>
			</div>
		</form>
	</div>
{/if}

{#if pendingDelete}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		transition:fade={{ duration: 150 }}
	>
		<div
			class="w-full max-w-sm rounded-lg border border-border bg-surface p-5"
			transition:fly={{ y: 8, duration: 160 }}
		>
			<h2 class="font-heading text-xl text-gold-100">Excluir conta</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				{pendingDelete.name} sai desta lista. Nada é gravado no servidor.
			</p>
			<div class="mt-5 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => (pendingDelete = null)}
					class="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-surface-hover"
				>
					Cancelar
				</button>
				<button
					type="button"
					onclick={removeUser}
					class="rounded-md bg-danger px-3 py-2 text-sm font-medium text-white hover:bg-danger/90"
				>
					Excluir
				</button>
			</div>
		</div>
	</div>
{/if}

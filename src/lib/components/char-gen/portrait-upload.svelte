<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		PORTRAIT_ACCEPTED_TYPES,
		PORTRAIT_MAX_BYTES,
		PORTRAIT_SIZE,
		type Portrait
	} from '$lib/char-gen/basic-info';
	import Ornament from '$lib/components/ui/ornament.svelte';
	import { formatBytes, toSquareImage } from '$lib/utils/image';
	import { cn } from '$lib/utils/ui';
	import {
		CircleAlert,
		Crop,
		ImagePlus,
		Info,
		LoaderCircle,
		RefreshCw,
		ScanFace,
		Trash2
	} from 'lucide-svelte';

	type Props = {
		value: Portrait | null;
		alt: string;
		/** Rendered right under the frame, like a plaque. */
		children?: Snippet;
	};

	let { value = $bindable(null), alt, children }: Props = $props();

	const id = $props.id();
	const inputId = `${id}-file`;
	const acceptedTypes: readonly string[] = PORTRAIT_ACCEPTED_TYPES;
	const formatLabels: Record<string, string> = {
		'image/png': 'PNG',
		'image/jpeg': 'JPG',
		'image/webp': 'WebP'
	};

	let input = $state<HTMLInputElement>();
	let dragging = $state(false);
	let processing = $state(false);
	let error = $state<string | null>(null);

	const isUpscaled = $derived(
		value !== null && Math.min(value.originalWidth, value.originalHeight) < PORTRAIT_SIZE
	);

	async function accept(file: File | undefined) {
		if (!file) return;
		error = null;

		if (!acceptedTypes.includes(file.type)) {
			error = 'Formato não suportado. Use PNG, JPG ou WebP.';
			return;
		}
		if (file.size > PORTRAIT_MAX_BYTES) {
			error = `Arquivo muito grande (${formatBytes(file.size)}). O limite é ${formatBytes(PORTRAIT_MAX_BYTES)}.`;
			return;
		}

		processing = true;
		try {
			const image = await toSquareImage(file, PORTRAIT_SIZE);
			value = {
				dataUrl: image.dataUrl,
				fileName: file.name,
				originalType: file.type,
				originalWidth: image.sourceWidth,
				originalHeight: image.sourceHeight,
				originalBytes: file.size,
				outputType: image.type,
				outputBytes: image.bytes
			};
		} catch {
			error = 'Não foi possível ler esta imagem. Tente outro arquivo.';
		} finally {
			processing = false;
			if (input) input.value = '';
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		const target = event.currentTarget as HTMLElement;
		if (!target.contains(event.relatedTarget as Node | null)) dragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		accept(event.dataTransfer?.files[0]);
	}

	function remove() {
		value = null;
		error = null;
	}
</script>

<div class="flex w-full flex-col items-center gap-5">
	<div class="relative">
		<input
			bind:this={input}
			id={inputId}
			type="file"
			accept={PORTRAIT_ACCEPTED_TYPES.join(',')}
			disabled={processing}
			aria-describedby="{id}-info"
			class="peer sr-only"
			onchange={(event) => accept(event.currentTarget.files?.[0])}
		/>
		<label
			for={inputId}
			class={cn(
				'group relative block size-56 cursor-pointer border border-gold-500 bg-linear-to-br from-gold-600 via-gold-800 to-gold-700 p-2 shadow-2xl shadow-black/70 transition-shadow peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-4 peer-focus-visible:ring-offset-surface peer-disabled:cursor-wait sm:size-64',
				dragging && 'ring-2 ring-gold-300 ring-offset-4 ring-offset-surface'
			)}
			ondragenter={handleDragOver}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<span
				class="relative block size-full overflow-hidden border border-black/70 bg-surface-raised"
			>
				{#if value}
					<span class="sr-only">Trocar retrato</span>
					<img
						src={value.dataUrl}
						{alt}
						width={PORTRAIT_SIZE}
						height={PORTRAIT_SIZE}
						class="size-full object-cover"
					/>
					<span
						class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 text-sm font-medium text-gold-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
					>
						<RefreshCw class="size-6" />
						Trocar retrato
					</span>
				{:else}
					<span
						class="flex size-full flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(45deg,transparent_0_10px,rgb(255_255_255/0.02)_10px_20px)] p-4 text-center text-muted-foreground transition-colors duration-200 group-hover:bg-surface-hover group-hover:text-foreground"
					>
						<ImagePlus
							class="mb-1 size-10 text-gold-400 transition-transform duration-300 group-hover:-translate-y-0.5"
							strokeWidth={1.5}
						/>
						<span class="font-heading text-lg font-semibold text-gold-100">Envie um retrato</span>
						<span class="text-sm">
							Toque para escolher<span class="hidden md:inline"> ou arraste até aqui</span>
						</span>
					</span>
				{/if}

				<span
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.5),inset_0_0_32px_rgb(0_0_0/0.75)]"
				></span>

				{#if dragging}
					<span
						class="absolute inset-2 flex items-center justify-center border-2 border-dashed border-gold-300 bg-primary-950/85 font-heading text-lg font-semibold text-gold-100"
					>
						Solte para enviar
					</span>
				{/if}

				{#if processing}
					<span
						class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75"
					>
						<LoaderCircle class="size-8 animate-spin text-gold-300" />
						<span class="text-sm text-gold-100">Preparando retrato…</span>
					</span>
				{/if}
			</span>
		</label>

		<Ornament class="-top-1 -left-1" />
		<Ornament class="-top-1 -right-1" />
		<Ornament class="-bottom-1 -left-1" />
		<Ornament class="-right-1 -bottom-1" />
	</div>

	{@render children?.()}

	<div id="{id}-info" class="w-full max-w-56 text-xs text-subtle-foreground sm:max-w-64">
		{#if value}
			<dl
				class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-md border border-border bg-background/50 p-3"
			>
				<dt>Arquivo</dt>
				<dd class="truncate text-right text-muted-foreground" title={value.fileName}>
					{value.fileName}
				</dd>
				<dt>Original</dt>
				<dd class="text-right text-muted-foreground tabular-nums">
					{value.originalWidth}×{value.originalHeight} · {formatLabels[value.originalType] ??
						value.originalType} · {formatBytes(value.originalBytes)}
				</dd>
				<dt>Salvo como</dt>
				<dd class="text-right text-gold-200 tabular-nums">
					{PORTRAIT_SIZE}×{PORTRAIT_SIZE} · {formatLabels[value.outputType] ?? value.outputType} ·
					{formatBytes(value.outputBytes)}
				</dd>
			</dl>
			{#if isUpscaled}
				<p class="mt-2 flex gap-2 text-warning">
					<CircleAlert class="mt-px size-3.5 shrink-0" />
					Imagem menor que {PORTRAIT_SIZE} px: o retrato pode ficar borrado.
				</p>
			{/if}
		{:else}
			<ul class="flex flex-col gap-1.5">
				<li class="flex gap-2">
					<Crop class="mt-px size-3.5 shrink-0 text-gold-500" />
					Recortada no centro em {PORTRAIT_SIZE}×{PORTRAIT_SIZE} px
				</li>
				<li class="flex gap-2">
					<Info class="mt-px size-3.5 shrink-0 text-gold-500" />
					PNG, JPG ou WebP · até {formatBytes(PORTRAIT_MAX_BYTES)}
				</li>
				<li class="flex gap-2">
					<ScanFace class="mt-px size-3.5 shrink-0 text-gold-500" />
					Prefira imagens quadradas, com o rosto centralizado
				</li>
			</ul>
		{/if}
	</div>

	{#if value}
		<div class="flex w-full max-w-56 gap-2 sm:max-w-64">
			<button
				type="button"
				disabled={processing}
				onclick={() => input?.click()}
				class="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
			>
				<RefreshCw class="size-4" />
				Trocar
			</button>
			<button
				type="button"
				disabled={processing}
				onclick={remove}
				class="inline-flex items-center justify-center gap-2 rounded-md border border-danger/40 px-3 py-2 text-sm font-medium text-danger transition-colors outline-none hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-60"
			>
				<Trash2 class="size-4" />
				Remover
			</button>
		</div>
	{/if}

	{#if error}
		<p
			role="alert"
			class="flex w-full max-w-56 gap-2 rounded-md border border-danger/40 bg-danger/10 p-2.5 text-xs text-danger sm:max-w-64"
		>
			<CircleAlert class="mt-px size-3.5 shrink-0" />
			{error}
		</p>
	{/if}
</div>

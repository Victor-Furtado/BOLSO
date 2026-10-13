<div role="status" aria-label="Carregando ancestralidades" class="flex flex-col gap-6">
	<div class="flex flex-col gap-3 sm:flex-row">
		<div class="h-11 flex-1 animate-pulse rounded-md bg-surface-raised"></div>
		<div class="h-11 w-full animate-pulse rounded-md bg-surface-raised sm:w-80"></div>
	</div>
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
		{#each { length: 8 }, index (index)}
			<div
				class="aspect-[4/5] animate-pulse rounded-lg border border-border bg-surface-raised"
				style:animation-delay="{index * 90}ms"
			></div>
		{/each}
	</div>
</div>

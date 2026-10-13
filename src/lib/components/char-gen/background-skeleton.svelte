<div role="status" aria-label="Carregando antecedentes" class="flex flex-col gap-6">
	<div class="flex flex-col gap-3 lg:flex-row">
		<div class="h-11 flex-1 animate-pulse rounded-md bg-surface-raised"></div>
		<div class="h-11 w-full animate-pulse rounded-md bg-surface-raised lg:w-80"></div>
	</div>
	<div class="grid gap-3 lg:grid-cols-2 lg:gap-4">
		{#each { length: 6 }, index (index)}
			<div
				class="h-48 animate-pulse rounded-lg border border-border bg-surface-raised"
				style:animation-delay="{index * 90}ms"
			></div>
		{/each}
	</div>
</div>

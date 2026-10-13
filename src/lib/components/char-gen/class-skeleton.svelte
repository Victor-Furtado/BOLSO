<div role="status" aria-label="Carregando classes" class="flex flex-col gap-6">
	<div class="h-5 w-40 animate-pulse rounded-sm bg-surface-raised"></div>
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
		{#each { length: 8 }, index (index)}
			<div
				class="aspect-[4/5] animate-pulse rounded-lg border border-border bg-surface-raised"
				style:animation-delay="{index * 90}ms"
			></div>
		{/each}
	</div>
</div>

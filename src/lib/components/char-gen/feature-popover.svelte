<script lang="ts">
	import { Popover } from 'bits-ui';
	import { featureTypeLabels, type GrantedFeature } from '$lib/char-gen/ancestry';
	import { cn } from '$lib/utils/ui';

	type Props = {
		feature: GrantedFeature;
		/** Mechanical rules, shown under the description. */
		rules?: string | null;
		class?: string;
		/** Render a non-focusable trigger, for use inside another interactive element. */
		nested?: boolean;
	};

	let { feature, rules = null, class: className, nested = false }: Props = $props();
</script>

{#if feature.description || rules}
	<Popover.Root>
		<Popover.Trigger
			openOnHover
			openDelay={250}
			closeDelay={150}
			class={cn(
				'cursor-help underline decoration-gold-600/60 decoration-dotted underline-offset-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-gold-600',
				className
			)}
		>
			{#snippet child({ props })}
				{#if nested}
					{@const {
						type: _type,
						tabindex: _tabindex,
						disabled: _disabled,
						onclick,
						...spanProps
					} = props}
					<span
						{...spanProps}
						onclick={(event) => {
							(onclick as (event: MouseEvent) => void)?.(event);
							event.stopPropagation();
						}}
					>
						{feature.name}
					</span>
				{:else}
					<button {...props} type="button">{feature.name}</button>
				{/if}
			{/snippet}
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content
				side="top"
				align="center"
				sideOffset={6}
				collisionPadding={12}
				trapFocus={false}
				class="z-60 w-max max-w-[min(20rem,calc(100vw-1.5rem))] origin-(--bits-popover-content-transform-origin) animate-popover-in rounded-md border border-gold-700 bg-surface-overlay px-3.5 py-3 shadow-xl shadow-black/60 outline-none data-[state=closed]:animate-popover-out motion-reduce:animate-none"
			>
				<span class="flex items-baseline justify-between gap-4">
					<span class="font-heading text-base leading-tight font-semibold text-gold-100">
						{feature.name}
					</span>
					<span class="text-[0.65rem] font-semibold tracking-wider text-gold-400 uppercase">
						{featureTypeLabels[feature.type] ?? feature.type}
					</span>
				</span>
				<span
					class="mt-1.5 block max-h-56 overflow-y-auto overscroll-contain pr-1 text-sm leading-snug text-foreground/85"
				>
					{#if feature.description}
						{feature.description}
					{/if}
					{#if rules}
						<span
							class="mt-2 block text-[0.65rem] font-semibold tracking-wider text-gold-400 uppercase"
						>
							Regras
						</span>
						<span class="mt-1 block">{rules}</span>
					{/if}
				</span>
				<Popover.Arrow class="text-gold-700" />
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
{:else}
	<span class={className}>{feature.name}</span>
{/if}

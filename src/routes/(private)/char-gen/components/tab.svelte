<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { type Icon as LucideIcon } from 'lucide-svelte';

	type TabProps = {
		Icon: typeof LucideIcon;
		Label: string;
		Value: string;
	};

	let { Icon, Label, Value }: TabProps = $props();
</script>

<Tabs.Trigger
	value={Value}
	class="flex shrink-0 items-center gap-2 rounded-md border border-transparent p-2 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground data-[state=active]:border-primary-500 data-[state=active]:bg-primary-950 data-[state=active]:text-foreground md:w-full"
>
	<Icon size={18} />
	{Label}
</Tabs.Trigger>

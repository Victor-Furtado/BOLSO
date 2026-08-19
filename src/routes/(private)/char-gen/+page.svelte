<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { FileUser } from 'lucide-svelte';
	import BasicInfo from './tabs/basic-info.svelte';

	let tab = $state('basic');
	let isMobile = $state(false);

	$effect(() => {
		const mediaQuery = window.matchMedia('(max-width: 767px)');
		const updateIsMobile = () => (isMobile = mediaQuery.matches);

		updateIsMobile();
		mediaQuery.addEventListener('change', updateIsMobile);

		return () => mediaQuery.removeEventListener('change', updateIsMobile);
	});

	let character = $state({
		nome: '',
		alcunha: '',
		origem: '',
		avatarPreview: '',
		citacao: ''
	});
</script>

<Tabs.Root
	activationMode="manual"
	orientation={isMobile ? 'horizontal' : 'vertical'}
	value={tab}
	onValueChange={(v) => (tab = v)}
	class="flex h-full w-full flex-col gap-4 md:flex-row"
>
	<Tabs.List class="flex w-full shrink-0 flex-row gap-1 overflow-x-auto md:w-48 md:flex-col">
		<Tabs.Trigger
			value="basic"
			class="flex shrink-0 items-center justify-evenly gap-2 rounded-md border border-transparent p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-50 data-[state=active]:border-slate-600 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-50 md:w-full"
		>
			<FileUser size={18} />
			Aventureiro
		</Tabs.Trigger>
	</Tabs.List>

	<div class="flex-1 overflow-y-auto">
		<Tabs.Content value="basic" class="space-y-6 pb-8">
			<BasicInfo bind:character />
		</Tabs.Content>
	</div>
</Tabs.Root>

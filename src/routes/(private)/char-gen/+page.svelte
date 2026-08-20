<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { FileUser, PersonStanding } from 'lucide-svelte';
	import BasicInfo from './tabs/basic-info.svelte';
	import Tab from './components/tab.svelte';

	let tab = $state('ancestry');
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
		<Tab Icon={FileUser} Label="Aventureiro" Value="basic" />
		<Tab Icon={PersonStanding} Label="Ancestralidade" Value="ancestry" />
	</Tabs.List>

	<div class="flex-1 overflow-y-auto">
		<Tabs.Content value="basic" class="space-y-6 pb-8">
			<BasicInfo bind:character />
		</Tabs.Content>
		<Tabs.Content value="ancestry" class="space-y-6 pb-8"></Tabs.Content>
	</div>
</Tabs.Root>

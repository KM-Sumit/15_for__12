<script lang="ts">
	import { Building2, ClipboardList, CreditCard, LayoutDashboard, Settings } from '@lucide/svelte';
	import AppShell from '#lib/components/shell/AppShell.svelte';
	import { MODULE_KEYS } from '#lib/features/platform/modules';
	import type { NavGroup, NavItem } from '#lib/components/shell/nav';

	let { data, children } = $props();

	const groups: NavGroup[] = [
		{ label: 'Platform', items: [{ href: '/super', label: 'Overview', icon: LayoutDashboard }] },
		{
			label: 'Manage',
			items: [
				{ href: '/super/institutes', label: 'Institutes', icon: Building2 },
				{ href: '/super/plans', label: 'Plans', icon: CreditCard },
				{ href: '/super/audit', label: 'Audit log', icon: ClipboardList }
			]
		},
		{ label: 'Settings', items: [{ href: '/super/settings', label: 'Platform settings', icon: Settings }] }
	];
	const tabs: NavItem[] = [
		{ href: '/super', label: 'Home', icon: LayoutDashboard },
		{ href: '/super/institutes', label: 'Institutes', icon: Building2 },
		{ href: '/super/plans', label: 'Plans', icon: CreditCard },
		{ href: '/super/audit', label: 'Audit', icon: ClipboardList }
	];
</script>

{#if data.bare || !data.user}
	{@render children()}
{:else}
	<AppShell
		{groups}
		{tabs}
		more
		user={data.user}
		modules={MODULE_KEYS}
		instituteName="EduSphere"
		area="Platform console"
	>
		{@render children()}
	</AppShell>
{/if}

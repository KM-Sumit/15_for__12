// Navigation maps for the two signed-in areas. One source for the desktop sidebar, the tablet/phone tab bar
// and the staff "More" sheet, so every surface agrees on names, icons and order. Items carry the module key
// that must be enabled for the current institute; AppShell filters them per request.
import {
	BadgeIndianRupee,
	ClipboardList,
	FileText,
	House,
	Inbox,
	LayoutDashboard,
	Library,
	ListChecks,
	Megaphone,
	ReceiptIndianRupee,
	Sparkles,
	TicketPercent,
	UserRound,
	UsersRound,
	BarChart3,
	Layers
} from '@lucide/svelte';
import type { ModuleKey } from '#lib/features/platform/modules';

export type NavItem = { href: string; label: string; icon: typeof House; adminOnly?: boolean; module?: ModuleKey };
export type NavGroup = { label: string; items: NavItem[] };

const starts = (prefix: string, p: string) => p === prefix || p.startsWith(prefix + '/');

/** Most specific match wins, so a section root (/app, /admin) is only active when nothing deeper claims the path. */
export function activeHref(items: NavItem[], path: string) {
	return [...items].sort((a, b) => b.href.length - a.href.length).find((i) => starts(i.href, path))?.href;
}

export const studentTabs: NavItem[] = [
	{ href: '/app', label: 'Home', icon: House, module: 'dashboard' },
	{ href: '/app/tests', label: 'Tests', icon: ListChecks, module: 'online_tests' },
	{ href: '/app/me/history', label: 'Results', icon: BarChart3, module: 'results' },
	{ href: '/app/me', label: 'Profile', icon: UserRound }
];

export const studentGroups: NavGroup[] = [
	{
		label: 'Learn',
		items: [
			{ href: '/app', label: 'Dashboard', icon: House, module: 'dashboard' },
			{ href: '/app/tests', label: 'Online tests', icon: ListChecks, module: 'online_tests' },
			{ href: '/app/me/history', label: 'My results', icon: BarChart3, module: 'results' }
		]
	},
	{
		label: 'You',
		items: [
			{ href: '/app/inbox', label: 'Inbox', icon: Inbox, module: 'notifications' },
			{ href: '/app/me', label: 'Profile', icon: UserRound }
		]
	}
];

export const staffGroups: NavGroup[] = [
	{ label: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
	{
		label: 'Teach',
		items: [
			{ href: '/admin/tests', label: 'Online tests', icon: ClipboardList, module: 'online_tests' },
			{ href: '/admin/tests/sets', label: 'Test series', icon: Layers, module: 'test_series' },
			{ href: '/admin/bank', label: 'Question bank', icon: Library, module: 'question_bank' },
			{ href: '/admin/bank/generate', label: 'AI generator', icon: Sparkles, module: 'ai_generator' },
			{ href: '/admin/materials', label: 'Study materials', icon: FileText, module: 'study_materials' }
		]
	},
	{
		label: 'People',
		items: [{ href: '/admin/students', label: 'Students', icon: UsersRound, module: 'students' }]
	},
	{
		label: 'Insights',
		items: [
			{ href: '/admin/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
			{ href: '/admin/announcements', label: 'Announcements', icon: Megaphone, module: 'notifications' },
			{ href: '/admin/banners', label: 'App banners', icon: ReceiptIndianRupee, module: 'notifications' }
		]
	},
	{
		label: 'Setup',
		items: [
			{ href: '/admin/settings', label: 'Institute settings', icon: BadgeIndianRupee },
			{ href: '/admin/payments', label: 'Payments', icon: TicketPercent, module: 'reports' }
		]
	}
];

/** Phone/tablet tabs for staff; everything else sits in the More sheet. */
export const staffTabs: NavItem[] = [
	{ href: '/admin', label: 'Home', icon: LayoutDashboard },
	{ href: '/admin/tests', label: 'Tests', icon: ClipboardList, module: 'online_tests' },
	{ href: '/admin/bank', label: 'Bank', icon: Library, module: 'question_bank' },
	{ href: '/admin/students', label: 'Students', icon: UsersRound, module: 'students' }
];

/**
 * Central module registry. One list drives the super-admin toggles, sidebar filtering, and route/API guards.
 * Keep this file client-safe: it is imported by navigation components as well as the server.
 */
export const MODULES = [
	{ key: 'dashboard', label: 'Dashboard', description: 'Home dashboard and overview widgets.' },
	{ key: 'online_tests', label: 'Online Tests', description: 'Create, publish and attempt tests.' },
	{ key: 'test_series', label: 'Test Series', description: 'Group tests into series and set series access.' },
	{ key: 'question_bank', label: 'Question Bank', description: 'Question modules, import and search.' },
	{ key: 'results', label: 'Results & Analytics', description: 'Student results, scores and analytics.' },
	{ key: 'study_materials', label: 'Study Materials', description: 'PDF notes, links and reading material.' },
	{ key: 'ai_generator', label: 'AI Test Generator', description: 'Generate questions from topics or PDFs.' },
	{ key: 'students', label: 'Student Management', description: 'Student accounts, batches and profiles.' },
	{ key: 'notifications', label: 'Notifications', description: 'Announcements, banners and the student inbox.' },
	{ key: 'reports', label: 'Reports', description: 'Institute usage, performance and export reports.' }
] as const;

export type ModuleKey = (typeof MODULES)[number]['key'];
export const MODULE_KEYS = MODULES.map((m) => m.key) as ModuleKey[];
export const DEFAULT_MODULES: ModuleKey[] = [...MODULE_KEYS];

export const isModuleKey = (k: string): k is ModuleKey => (MODULE_KEYS as string[]).includes(k);

/** Human label for a key (module management screens). */
export const moduleLabel = (k: string) => MODULES.find((m) => m.key === k)?.label ?? k;

/**
 * Most specific prefix wins. `dashboard` is intentionally not mapped: the home screens stay reachable so an
 * institute can never lock itself out of its own admin panel.
 */
const ROUTE_RULES: { prefix: string; module: ModuleKey }[] = [
	{ prefix: '/admin/bank/generate', module: 'ai_generator' },
	{ prefix: '/admin/bank', module: 'question_bank' },
	{ prefix: '/admin/tests/sets', module: 'test_series' },
	{ prefix: '/admin/tests', module: 'online_tests' },
	{ prefix: '/admin/students', module: 'students' },
	{ prefix: '/admin/materials', module: 'study_materials' },
	{ prefix: '/admin/reports', module: 'reports' },
	{ prefix: '/admin/announcements', module: 'notifications' },
	{ prefix: '/admin/banners', module: 'notifications' },
	{ prefix: '/admin/notifications', module: 'notifications' },
	{ prefix: '/app/tests', module: 'online_tests' },
	{ prefix: '/app/results', module: 'results' },
	{ prefix: '/app/me/history', module: 'results' },
	{ prefix: '/app/materials', module: 'study_materials' },
	{ prefix: '/app/inbox', module: 'notifications' },
	{ prefix: '/app/pt', module: 'test_series' },
	{ prefix: '/api/attempts', module: 'online_tests' },
	{ prefix: '/api/ai', module: 'ai_generator' },
	{ prefix: '/api/materials', module: 'study_materials' }
];

export function moduleForPath(path: string): ModuleKey | null {
	const p = path.replace(/\/+$/, '') || '/';
	let best: { prefix: string; module: ModuleKey } | undefined;
	for (const r of ROUTE_RULES) {
		if ((p === r.prefix || p.startsWith(r.prefix + '/')) && (!best || r.prefix.length > best.prefix.length)) best = r;
	}
	return best?.module ?? null;
}

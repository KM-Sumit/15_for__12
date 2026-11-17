// Review gallery: screenshots every main page on phone + desktop and writes one self-contained HTML file.
// Usage: bun scripts/gallery.ts <out.html> [--base http://127.0.0.1:5174]
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const out = args[0] ?? 'gallery.html';
const bi = args.indexOf('--base');
const base = bi >= 0 ? args[bi + 1] : 'http://127.0.0.1:5174';
const ids = JSON.parse(process.env.GALLERY_IDS ?? '{}') as Record<string, string>;

type Page = { group: string; title: string; path: string };
const pages: Page[] = [
	{ group: 'Public website', title: 'Home', path: '/' },
	{ group: 'Public website', title: 'Exams', path: '/exams' },
	{ group: 'Public website', title: 'Exam: SSC CGL', path: '/exams/ssc/ssc-cgl' },
	{ group: 'Public website', title: 'Courses', path: '/courses' },
	{ group: 'Public website', title: 'Course page', path: `/courses/${ids.courseSlug}` },
	{ group: 'Public website', title: 'Results', path: '/results' },
	{ group: 'Public website', title: 'Faculty', path: '/faculty' },
	{ group: 'Public website', title: 'About', path: '/about' },
	{ group: 'Public website', title: 'Contact', path: '/contact' },
	{ group: 'Public website', title: 'Privacy policy', path: '/legal/privacy' },
	{ group: 'Public website', title: 'Sign in', path: '/login' },
	{ group: 'Student app', title: 'Today', path: '/app' },
	{ group: 'Student app', title: 'Learn', path: '/app/learn' },
	{ group: 'Student app', title: 'Course outline', path: `/app/learn/${ids.courseSlug}` },
	{ group: 'Student app', title: 'Lesson player', path: `/app/learn/${ids.courseSlug}/${ids.lessonId}` },
	{ group: 'Student app', title: 'Notes', path: '/app/notes' },
	{ group: 'Student app', title: 'Note reader', path: `/app/notes/${ids.noteSlug}` },
	{ group: 'Student app', title: 'Tests', path: '/app/tests' },
	{ group: 'Student app', title: 'Test instructions', path: `/app/tests/${ids.testId}` },
	{ group: 'Student app', title: 'Result and solutions', path: `/app/results/${ids.attemptId}` },
	{ group: 'Student app', title: 'Exam hub', path: `/app/exams/ssc-cgl` },
	{ group: 'Student app', title: 'Inbox', path: '/app/inbox' },
	{ group: 'Student app', title: 'Me', path: '/app/me' },
	{ group: 'Student app', title: 'Test history', path: '/app/me/history' },
	{ group: 'Student app', title: 'Billing', path: '/app/me/billing' },
	{ group: 'Student app', title: 'Checkout', path: `/app/checkout?product=${ids.productId}` },
	{ group: 'Staff console', title: 'Dashboard', path: '/admin' },
	{ group: 'Staff console', title: 'Tests', path: '/admin/tests' },
	{ group: 'Staff console', title: 'New test wizard', path: '/admin/tests/new' },
	{ group: 'Staff console', title: 'Test overview', path: `/admin/tests/${ids.testId}` },
	{ group: 'Staff console', title: 'Test results', path: `/admin/tests/${ids.testId}/results` },
	{ group: 'Staff console', title: 'Question bank', path: '/admin/bank' },
	{ group: 'Staff console', title: 'Module', path: `/admin/bank/${ids.moduleId}` },
	{ group: 'Staff console', title: 'Import questions', path: '/admin/bank/import' },
	{ group: 'Staff console', title: 'Generate with AI', path: '/admin/bank/generate' },
	{ group: 'Staff console', title: 'Courses', path: '/admin/courses' },
	{ group: 'Staff console', title: 'Course editor', path: `/admin/courses/${ids.courseId}` },
	{ group: 'Staff console', title: 'Notes', path: '/admin/notes' },
	{ group: 'Staff console', title: 'Note editor', path: `/admin/notes/${ids.noteId}` },
	{ group: 'Staff console', title: 'Students', path: '/admin/students' },
	{ group: 'Staff console', title: 'Student profile', path: `/admin/students/${ids.studentId}` },
	{ group: 'Staff console', title: 'Sessions and batches', path: '/admin/batches' },
	{ group: 'Staff console', title: 'Batch', path: `/admin/batches/${ids.batchId}` },
	{ group: 'Staff console', title: 'Announcements', path: '/admin/announcements' },
	{ group: 'Staff console', title: 'Home banners', path: '/admin/banners' },
	{ group: 'Staff console', title: 'Enquiries', path: '/admin/leads' },
	{ group: 'Staff console', title: 'Website', path: '/admin/site' },
	{ group: 'Staff console', title: 'Passes and prices', path: '/admin/products' },
	{ group: 'Staff console', title: 'Payments', path: '/admin/payments' },
	{ group: 'Staff console', title: 'Exams and subjects', path: '/admin/taxonomy' },
	{ group: 'Staff console', title: 'Team and roles', path: '/admin/team' }
];

const sizes = [
	{ name: 'Phone', width: 390, height: 844, mobile: true, maxH: 2400 },
	{ name: 'Desktop', width: 1280, height: 800, mobile: false, maxH: 1600 }
];

const browser = await chromium.launch();
const shots = new Map<string, Record<string, string>>();
for (const s of sizes) {
	const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, isMobile: s.mobile, hasTouch: s.mobile, deviceScaleFactor: 1 });
	for (const p of pages) {
		const page = await ctx.newPage();
		try {
			await page.goto(base + p.path, { waitUntil: 'networkidle', timeout: 90_000 });
			await page.waitForTimeout(400);
			const h = Math.min(s.maxH, await page.evaluate(() => document.documentElement.scrollHeight));
			const buf = await page.screenshot({ type: 'jpeg', quality: 62, fullPage: true, clip: { x: 0, y: 0, width: s.width, height: h } });
			const rec = shots.get(p.path) ?? {};
			rec[s.name] = buf.toString('base64');
			shots.set(p.path, rec);
			console.log('ok', s.name, p.path);
		} catch (e) {
			console.log('FAIL', s.name, p.path, String(e).slice(0, 120));
		}
		await page.close();
	}
	await ctx.close();
}
await browser.close();

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const groups = [...new Set(pages.map((p) => p.group))];
const body = groups
	.map((g) => {
		const items = pages
			.filter((p) => p.group === g)
			.map((p) => {
				const r = shots.get(p.path) ?? {};
				return `<article id="${esc(p.path)}"><header><h3>${esc(p.title)}</h3><code>${esc(p.path)}</code></header><div class="pair">
${r.Phone ? `<figure class="phone"><img loading="lazy" alt="${esc(p.title)} on phone" src="data:image/jpeg;base64,${r.Phone}"><figcaption>Phone 390</figcaption></figure>` : ''}
${r.Desktop ? `<figure class="desk"><img loading="lazy" alt="${esc(p.title)} on desktop" src="data:image/jpeg;base64,${r.Desktop}"><figcaption>Desktop 1280</figcaption></figure>` : ''}
</div></article>`;
			})
			.join('\n');
		return `<section><h2>${esc(g)}</h2>${items}</section>`;
	})
	.join('\n');
const nav = groups
	.map((g) => `<p>${esc(g)}</p>` + pages.filter((p) => p.group === g).map((p) => `<a href="#${esc(p.path)}">${esc(p.title)}</a>`).join(''))
	.join('');

writeFileSync(
	out,
	`<title>UCI screen review</title><meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{--bg:#f4f6f8;--fg:#151a23;--muted:#5b6575;--card:#fff;--line:#dfe4ea;--accent:#c25a0e}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f1218;--fg:#e9edf2;--muted:#9aa4b2;--card:#161b23;--line:#262d38;--accent:#f29a4f;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0f1218;--fg:#e9edf2;--muted:#9aa4b2;--card:#161b23;--line:#262d38;--accent:#f29a4f;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{display:grid;grid-template-columns:220px minmax(0,1fr);gap:24px;max-width:1500px;margin:0 auto;padding-block:24px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
nav{position:sticky;top:16px;align-self:start;max-height:calc(100vh - 32px);overflow:auto;font-size:13px}
nav p{margin:16px 0 4px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:11px;color:var(--muted)}
nav a{display:block;padding:3px 0;color:var(--fg);text-decoration:none}nav a:hover{color:var(--accent)}
h1{margin:0 0 4px;font-size:28px}h2{margin:40px 0 12px;font-size:20px;border-bottom:1px solid var(--line);padding-bottom:8px}
article{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:0 0 16px}
article header{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:baseline;margin-bottom:12px}h3{margin:0;font-size:16px}code{color:var(--muted);font-size:12px}
.pair{display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px;align-items:start}
figure{margin:0}figure img{width:100%;height:auto;display:block;border:1px solid var(--line);border-radius:10px}
figcaption{font-size:12px;color:var(--muted);margin-top:4px}
@media (max-width:860px){.wrap{grid-template-columns:minmax(0,1fr)}nav{position:static;max-height:none}.pair{grid-template-columns:minmax(0,1fr)}.phone{max-width:300px}}
</style><div class="wrap"><nav aria-label="Screens"><strong>UCI</strong>${nav}</nav><main>
<h1>UCI screen review</h1><p style="color:var(--muted);margin:0">Every main screen on a 390 px phone and a 1280 px desktop, light theme, with local seed data. Long pages are cut off at the bottom.</p>
${body}</main></div>`
);
console.log('wrote', out);

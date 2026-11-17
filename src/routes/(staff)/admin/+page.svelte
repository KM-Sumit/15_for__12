<script lang="ts">
	import { ClipboardList, FileText, Sparkles, UsersRound, Trophy, ArrowRight, Plus, Check, Copy } from '@lucide/svelte';
	import type { ModuleKey } from '#lib/features/platform/modules';
	let { data } = $props();
	let copied = $state(false);
	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText(data.institute.slug);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			/* clipboard blocked — the code is visible anyway */
		}
	};
	const quick = $derived(
		[
			{ href: '/admin/tests/new', label: 'Create test', icon: ClipboardList, module: 'online_tests' },
			{ href: '/admin/bank', label: 'Question bank', icon: ClipboardList, module: 'question_bank' },
			{ href: '/admin/materials', label: 'Add material', icon: FileText, module: 'study_materials' },
			{ href: '/admin/students', label: 'Manage students', icon: UsersRound, module: 'students' },
			{ href: '/admin/bank/generate', label: 'AI generator', icon: Sparkles, module: 'ai_generator' }
		].filter((q) => data.modules.includes(q.module as ModuleKey))
	);
</script>

<svelte:head><title>Dashboard · {data.institute.name}</title></svelte:head>

<div class="dash">
	<header class="rise">
		<p class="eyebrow">{data.institute.role === 'teacher' ? 'Teacher console' : 'Admin console'}</p>
		<h1 class="page-title">{data.institute.name}</h1>
		<p class="page-sub">Everything your institute runs — tests, students, materials and results — in one workspace.</p>
		<div class="code-line">
			<span class="tiny muted">Institute code</span>
			<code class="code-pill">{data.institute.slug}</code>
			<button class="btn btn-ghost btn-sm" type="button" onclick={copyCode} aria-label="Copy institute code">
				{#if copied}<Check /> Copied{:else}<Copy /> Copy{/if}
			</button>
			<a class="tiny code-link" href={'/i/' + data.institute.slug} target="_blank" rel="noreferrer">Student join link <ArrowRight class="inline size-3" /></a>
		</div>
	</header>

	<section class="kpis rise" style="--i: 1" aria-label="Key numbers">
		<article class="kpi"><span class="kpi-label">Students</span><span class="kpi-value">{data.stats.students}</span><span class="kpi-note">{data.stats.activeStudents} active this week</span></article>
		<article class="kpi"><span class="kpi-label">Tests</span><span class="kpi-value">{data.stats.tests}</span><span class="kpi-note">{data.stats.attempts} attempts</span></article>
		<article class="kpi"><span class="kpi-label">Materials</span><span class="kpi-value">{data.stats.materials}</span><span class="kpi-note">published resources</span></article>
		<article class="kpi"><span class="kpi-label">Modules</span><span class="kpi-value">{data.modules.length}</span><span class="kpi-note">enabled by platform</span></article>
	</section>

	<section class="rise" style="--i: 2">
		<div class="section-head"><h2 class="section-title">Quick actions</h2></div>
		<div class="quick">
			{#each quick as q (q.href)}
				<a class="quick-item" href={q.href}><q.icon /><span>{q.label}</span><ArrowRight /></a>
			{:else}
				<p class="muted">No editing modules are enabled for this institute.</p>
			{/each}
		</div>
	</section>

	<div class="cols">
		<section class="rise" style="--i: 3">
			<div class="section-head">
				<h2 class="section-title">Recent results</h2>
				<a class="link" href="/admin/reports">Reports <ArrowRight /></a>
			</div>
			{#if data.recent.length}
				<div class="list">
					{#each data.recent as r (r.attemptId)}
						<a class="list-row" href="/admin/tests/{r.testId}/results">
							<span class="grow">
								<span class="title block">{r.name || r.email}</span>
								<span class="meta block">{r.test} · {new Date(r.startedAt).toLocaleDateString('en-IN')}</span>
							</span>
							<span class="trail">
								<span class="score">{r.percentage == null ? '—' : `${r.percentage}%`}</span>
								<span class="tiny muted">{r.score ?? '—'}/{r.maxScore ?? '—'}</span>
							</span>
						</a>
					{/each}
				</div>
			{:else}
				<div class="empty"><Trophy /><p>Results appear here after your first test is submitted.</p></div>
			{/if}
		</section>

		<section class="rise" style="--i: 4">
			<div class="section-head"><h2 class="section-title">Upcoming tests</h2></div>
			{#if data.upcoming.length}
				<div class="list">
					{#each data.upcoming as t (t.id)}
						<a class="list-row" href="/admin/tests/{t.id}">
							<span class="grow"><span class="title block">{t.title}</span><span class="meta block">{t.startsAt ? new Date(t.startsAt).toLocaleString('en-IN') : 'No start time'}</span></span>
							<ArrowRight class="chev" />
						</a>
					{/each}
				</div>
			{:else}
				<div class="empty"><Plus /><p>No tests scheduled. Create one to get started.</p></div>
			{/if}
		</section>
	</div>
</div>

<style>
	.dash { max-width: 72rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.75rem; }
	.code-line { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin-top: .75rem; }
	.code-pill { padding: .25rem .6rem; border: 1px dashed hsl(var(--border)); border-radius: .5rem; background: hsl(var(--surface)); font-size: .9rem; letter-spacing: .02em; }
	.code-link { display: inline-flex; align-items: center; gap: .2rem; }
	.kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
	@media (min-width: 900px) { .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
	.kpi { display: grid; gap: .15rem; padding: 1rem; border: 1px solid hsl(var(--border)); border-radius: 1rem; background: hsl(var(--surface)); }
	.kpi-label { font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: hsl(var(--muted-foreground)); }
	.kpi-value { font-family: var(--font-display); font-size: 2rem; font-weight: 800; line-height: 1.1; }
	.kpi-note { font-size: .8125rem; color: hsl(var(--muted-foreground)); }
	.quick { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: .625rem; }
	.quick-item { display: flex; align-items: center; gap: .625rem; padding: .875rem 1rem; border-radius: .9rem; border: 1px solid hsl(var(--border)); background: hsl(var(--surface)); font-weight: 650; }
	.quick-item :global(svg) { width: 18px; height: 18px; color: hsl(var(--primary)); }
	.quick-item :global(svg:last-child) { margin-left: auto; color: hsl(var(--muted-foreground)); }
	.cols { display: grid; gap: 1.75rem; }
	@media (min-width: 1024px) { .cols { grid-template-columns: 1.35fr 1fr; align-items: start; } }
	.empty { display: grid; place-items: center; gap: .5rem; padding: 2.5rem 1rem; text-align: center; border: 1px dashed hsl(var(--border)); border-radius: 1rem; color: hsl(var(--muted-foreground)); }
	.empty :global(svg) { width: 26px; height: 26px; }
	.score { display: block; font-family: var(--font-mono); font-weight: 700; }
</style>

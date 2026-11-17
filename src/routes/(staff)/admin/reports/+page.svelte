<script lang="ts">
	import { Activity, BarChart3, ClipboardList, FileText, Trophy, UsersRound } from '@lucide/svelte';

	let { data } = $props();
	const t = $derived(data.totals);
	const maxMonth = $derived(Math.max(1, ...data.monthly.map((m) => m.n)));
	const monthLabel = (key: string) => {
		const [y, m] = key.split('-').map(Number);
		return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
	};
</script>

<svelte:head><title>Reports · {data.institute}</title></svelte:head>

<div class="wrap">
	<header class="rise">
		<p class="eyebrow">Insights</p>
		<h1 class="page-title">Reports</h1>
		<p class="page-sub">Usage and performance across {data.institute}. Figures update as students attempt tests.</p>
	</header>

	<section class="kpis rise" style="--i: 1" aria-label="Key numbers">
		<article><UsersRound /><span>Students</span><strong>{t.students}</strong><small>{t.activeStudents} active this week</small></article>
		<article><ClipboardList /><span>Tests</span><strong>{t.tests}</strong><small>{t.attempts} submitted attempts</small></article>
		<article><BarChart3 /><span>Average score</span><strong>{t.avgPercent}%</strong><small>across graded attempts</small></article>
		<article><FileText /><span>Materials</span><strong>{t.materials}</strong><small>published resources</small></article>
	</section>

	<div class="cols">
		<section class="card card-pad rise" style="--i: 2">
			<div class="card-head"><h2>Attempts, last 6 months</h2><Activity /></div>
			{#if data.monthly.length}
				<div class="bars" role="img" aria-label="Attempts per month">
					{#each data.monthly as m (m.month)}
						<div class="bar">
							<span class="n">{m.n}</span>
							<span class="col" style="height: {Math.max(6, Math.round((m.n / maxMonth) * 100))}%"></span>
							<span class="m">{monthLabel(m.month)}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="muted small">No attempts recorded yet.</p>
			{/if}
		</section>

		<section class="card card-pad rise" style="--i: 3">
			<div class="card-head"><h2>Top students</h2><Trophy /></div>
			{#if data.topStudents.length}
				<ol class="top">
					{#each data.topStudents as s, i (s.id)}
						<li><span class="rank">{i + 1}</span><span class="grow"><span class="name">{s.name}</span><span class="meta">{s.attempts} attempts</span></span><strong>{s.avgPercent}%</strong></li>
					{/each}
				</ol>
			{:else}
				<p class="muted small">Rankings appear after the first test is graded.</p>
			{/if}
		</section>
	</div>

	<section class="rise" style="--i: 4">
		<div class="section-head"><h2 class="section-title">Test performance</h2></div>
		<div class="table-wrap card">
			<table>
				<thead><tr><th>Test</th><th>Status</th><th class="num">Attempts</th><th class="num">Avg</th><th class="num">Top</th></tr></thead>
				<tbody>
					{#each data.perTest as row (row.id)}
						<tr>
							<td class="title"><a href="/admin/tests/{row.id}/results">{row.title}</a></td>
							<td><span class="badge" class:badge-live={row.status === 'published'} class:badge-draft={row.status === 'draft'}>{row.status}</span></td>
							<td class="num">{row.attempts}</td>
							<td class="num">{row.submitted ? `${row.avgPercent}%` : '—'}</td>
							<td class="num">{row.submitted ? `${row.topPercent}%` : '—'}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="muted">No tests yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>

<style>
	.wrap { max-width: 68rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.4rem; }
	.kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
	@media (min-width: 860px) { .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
	.kpis article { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: .2rem .55rem; padding: .9rem 1rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 1rem; }
	.kpis :global(svg) { width: 1.1rem; height: 1.1rem; color: hsl(var(--primary)); grid-row: span 2; }
	.kpis span { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; color: hsl(var(--muted-foreground)); }
	.kpis strong { font-family: var(--font-display); font-size: 1.65rem; font-weight: 800; line-height: 1; }
	.kpis small { grid-column: 1 / -1; font-size: .75rem; color: hsl(var(--muted-foreground)); }
	.cols { display: grid; gap: 1rem; }
	@media (min-width: 900px) { .cols { grid-template-columns: 1.4fr 1fr; } }
	.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .9rem; }
	.card-head :global(svg) { width: 1.1rem; height: 1.1rem; color: hsl(var(--muted-foreground)); }
	.bars { display: flex; align-items: flex-end; gap: .45rem; height: 12rem; padding-top: 1rem; }
	.bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .25rem; height: 100%; justify-content: flex-end; min-width: 0; }
	.bar .col { width: 100%; max-width: 2.5rem; border-radius: .4rem .4rem 0 0; background: linear-gradient(180deg, hsl(var(--primary)), hsl(var(--primary) / .55)); }
	.bar .n { font-size: .75rem; font-weight: 700; }
	.bar .m { font-size: .7rem; color: hsl(var(--muted-foreground)); white-space: nowrap; }
	.top { display: grid; gap: .35rem; }
	.top li { display: flex; align-items: center; gap: .6rem; padding: .45rem 0; border-bottom: 1px solid hsl(var(--border)); }
	.top li:last-child { border-bottom: 0; }
	.rank { display: grid; place-items: center; width: 1.65rem; height: 1.65rem; border-radius: 999px; background: hsl(var(--muted)); font-size: .75rem; font-weight: 800; }
	.name { display: block; font-weight: 600; font-size: .9rem; }
	.meta { display: block; font-size: .75rem; color: hsl(var(--muted-foreground)); }
	.top strong { font-family: var(--font-mono); font-size: .9rem; }
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: .875rem; }
	th, td { padding: .65rem .8rem; text-align: left; border-bottom: 1px solid hsl(var(--border)); vertical-align: middle; }
	th { font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: hsl(var(--muted-foreground)); }
	tr:last-child td { border-bottom: 0; }
	.num { text-align: right; font-family: var(--font-mono); }
	.title { font-weight: 600; min-width: 12rem; }
	.title a:hover { color: hsl(var(--primary)); }
</style>

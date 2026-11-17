<script lang="ts">
	import { ArrowRight, Building2, ClipboardList, CreditCard, Plus, UsersRound, Wallet } from '@lucide/svelte';
	import { MODULES } from '#lib/features/platform/modules';

	let { data } = $props();
	const s = $derived(data.stats);
	const money = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
	const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
</script>

<svelte:head><title>Platform overview · EduSphere</title></svelte:head>

<div class="wrap">
	<header class="rise">
		<p class="eyebrow">Platform console</p>
		<h1 class="page-title">EduSphere overview</h1>
		<p class="page-sub">Every coaching institute, its people and its usage in one place.</p>
	</header>

	<section class="kpis rise" style="--i: 1" aria-label="Platform numbers">
		<article><Building2 /><span>Institutes</span><strong>{s.institutes}</strong><small>{s.activeInstitutes} active · {s.suspendedInstitutes} suspended</small></article>
		<article><UsersRound /><span>Students</span><strong>{s.students}</strong><small>{s.staff} staff accounts</small></article>
		<article><ClipboardList /><span>Tests</span><strong>{s.tests}</strong><small>{s.attempts} attempts</small></article>
		<article><Wallet /><span>Collected</span><strong>{money(s.revenuePaise)}</strong><small>paid transactions</small></article>
	</section>

	<div class="cols">
		<section class="rise" style="--i: 2">
			<div class="section-head"><h2 class="section-title">Institutes</h2><a class="section-link" href="/super/institutes">Manage all</a></div>
			<div class="list">
				{#each data.recent as i (i.id)}
					<a class="list-row" href="/super/institutes/{i.id}">
						<span class="leading-icon"><Building2 /></span>
						<span class="grow"><span class="title block">{i.name}</span><span class="meta block">/{i.slug} · {i.students} students · {i.tests} tests</span></span>
						<span class="badge" class:badge-live={i.status === 'active'} class:badge-danger={i.status !== 'active'}>{i.status}</span>
					</a>
				{:else}
					<p class="muted small">No institutes yet. <a class="underline" href="/super/institutes">Create the first one</a>.</p>
				{/each}
			</div>
		</section>

		<section class="rise" style="--i: 3">
			<div class="section-head"><h2 class="section-title">Quick actions</h2></div>
			<div class="quick">
				<a class="quick-item" href="/super/institutes"><Plus /><span>Create institute</span><ArrowRight /></a>
				<a class="quick-item" href="/super/plans"><CreditCard /><span>Manage plans</span><ArrowRight /></a>
				<a class="quick-item" href="/super/audit"><ClipboardList /><span>Review audit log</span><ArrowRight /></a>
			</div>
		</section>
	</div>

	<section class="rise" style="--i: 4">
		<div class="section-head"><h2 class="section-title">Modules available</h2></div>
		<div class="modules">
			{#each MODULES as m (m.key)}
				<article class="card card-pad"><h3>{m.label}</h3><p>{m.description}</p></article>
			{/each}
		</div>
	</section>

	<section class="rise" style="--i: 5">
		<div class="section-head"><h2 class="section-title">Recent activity</h2><a class="section-link" href="/super/audit">Full log</a></div>
		<ul class="list">
			{#each data.audit as a (a.id)}
				<li class="list-row">
					<span class="grow"><span class="title block">{a.action.replaceAll('_', ' ')} {a.target ? `· ${a.target}` : ''}</span><span class="meta block">{a.institute} · {a.actor} · {when(a.at)}</span></span>
				</li>
			{:else}
				<li class="list-row"><span class="muted small">No activity recorded yet.</span></li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.wrap { max-width: 70rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.5rem; }
	.kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
	@media (min-width: 860px) { .kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
	.kpis article { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: .15rem .55rem; padding: .9rem 1rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 1rem; }
	.kpis :global(svg) { width: 1.1rem; height: 1.1rem; color: hsl(var(--primary)); grid-row: span 2; }
	.kpis span { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; color: hsl(var(--muted-foreground)); }
	.kpis strong { font-family: var(--font-display); font-size: 1.55rem; font-weight: 800; line-height: 1; }
	.kpis small { grid-column: 1 / -1; font-size: .75rem; color: hsl(var(--muted-foreground)); }
	.cols { display: grid; gap: 1.25rem; }
	@media (min-width: 900px) { .cols { grid-template-columns: 1.35fr 1fr; } }
	.leading-icon { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: .75rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); flex-shrink: 0; }
	.leading-icon :global(svg) { width: 1.1rem; height: 1.1rem; }
	.quick { display: grid; gap: .5rem; }
	.quick-item { display: flex; align-items: center; gap: .6rem; padding: .7rem .8rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: .8rem; font-weight: 600; font-size: .9rem; }
	.quick-item span { flex: 1; }
	.quick-item :global(svg:first-child) { width: 1.1rem; height: 1.1rem; color: hsl(var(--primary)); }
	.quick-item :global(svg:last-child) { width: .95rem; height: .95rem; color: hsl(var(--muted-foreground)); }
	.modules { display: grid; gap: .6rem; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); }
	.modules h3 { font-size: .9rem; font-weight: 700; }
	.modules p { font-size: .8125rem; color: hsl(var(--muted-foreground)); margin-top: .2rem; }
</style>

<script lang="ts">
	import { ArrowRight, BarChart3, Building2, Check, ClipboardList, FileText, GraduationCap, Layers, ShieldCheck, Sparkles, UsersRound, Zap } from '@lucide/svelte';
	import { MODULES } from '#lib/features/platform/modules';
	import Brand from '#lib/components/shell/Brand.svelte';

	let { data } = $props();

	const icons = [BarChart3, ClipboardList, Layers, FileText, Sparkles, UsersRound, Zap, GraduationCap, ShieldCheck, BarChart3];
	const steps = [
		{ k: 'Create the institute', body: 'The platform owner adds a coaching institute, picks a plan and creates its admin account.' },
		{ k: 'Turn modules on', body: 'Enable only what the institute needs. Disabled modules disappear from navigation and are blocked at the URL.' },
		{ k: 'Students sign in', body: 'Each institute gets its own sign-in page. Students see their tests, materials and results — never another institute’s.' }
	];
	const benefits = [
		'One login page per institute',
		'Row-level tenant isolation in Postgres',
		'Module switches that really block access',
		'Plans, limits and audit logs built in'
	];
</script>

<svelte:head>
	<title>{data.brand.name} · Exam preparation platform for coaching institutes</title>
	<meta name="description" content="EduSphere is a multi-tenant exam preparation platform: online tests, question bank, study materials, results and student management, isolated per coaching institute." />
</svelte:head>

<section class="hero site-wrap">
	<div class="hero-copy rise">
		<p class="hero-kicker"><span>Multi-tenant exam platform</span></p>
		<h1>
			<span class="line">Run your coaching</span>
			<span class="line accent">like a product.</span>
		</h1>
		<p class="hero-sub">
			EduSphere gives every institute its own branded workspace for online tests, study material, results and student management — with strict isolation and module controls at the platform level.
		</p>
		<div class="hero-cta">
			<a href="/login" class="btn btn-primary btn-lg">Open your workspace<ArrowRight /></a>
			<a href="#modules" class="btn btn-ghost btn-lg">Explore modules</a>
		</div>
		<ul class="hero-points">
			{#each benefits as b (b)}<li><Check />{b}</li>{/each}
		</ul>
	</div>

	<div class="hero-media rise" style="--i: 1" aria-hidden="true">
		<div class="mock">
			<div class="mock-bar"><Brand href="/" name={data.brand.name} compact /><span class="mock-pill">Admin</span></div>
			<div class="mock-body">
				<div class="mock-kpis">
					<div><span>Students</span><strong>—</strong><small>this institute</small></div>
					<div><span>Tests</span><strong>—</strong><small>live + practice</small></div>
					<div><span>Results</span><strong>—</strong><small>graded</small></div>
				</div>
				<div class="mock-row"><span class="dot"></span><span class="grow"><span class="bar w1"></span><span class="bar w2"></span></span><span class="tag">Test series</span></div>
				<div class="mock-row"><span class="dot"></span><span class="grow"><span class="bar w3"></span><span class="bar w4"></span></span><span class="tag">Question bank</span></div>
				<div class="mock-row"><span class="dot"></span><span class="grow"><span class="bar w2"></span><span class="bar w1"></span></span><span class="tag">Materials</span></div>
			</div>
			<div class="mock-foot"><ShieldCheck />Isolated by institute</div>
		</div>
	</div>
</section>

<section class="site-wrap strip" aria-label="Platform facts">
	<div><strong>{data.instituteCount || 'Your'}</strong><span>{data.instituteCount === 1 ? 'institute' : 'institutes'} on the platform</span></div>
	<div><strong>{MODULES.length}</strong><span>swappable modules</span></div>
	<div><strong>1</strong><span>workspace per institute</span></div>
	<div><strong>100%</strong><span>tenant-scoped queries</span></div>
</section>

<section id="modules" class="site-wrap sec">
	<header class="sec-head">
		<p class="eyebrow">Modules</p>
		<h2>Everything a coaching institute runs, in one place</h2>
		<p>Each module can be enabled per institute. The navigation, direct URLs and APIs all respect the switch.</p>
	</header>
	<div class="modules-grid">
		{#each MODULES as m, i (m.key)}
			{@const Icon = icons[i % icons.length]}
			<article class="module-card rise" style="--i: {i % 6}">
				<span class="module-icon"><Icon /></span>
				<h3>{m.label}</h3>
				<p>{m.description}</p>
			</article>
		{/each}
	</div>
</section>

<section id="how" class="site-wrap sec">
	<div class="how">
		<header class="sec-head">
			<p class="eyebrow">How it works</p>
			<h2>Onboard an institute in minutes</h2>
		</header>
		<ol class="steps">
			{#each steps as s, i (s.k)}
				<li class="step rise" style="--i: {i}">
					<span class="bubble">{i + 1}</span>
					<div><h3>{s.k}</h3><p>{s.body}</p></div>
				</li>
			{/each}
		</ol>
	</div>
</section>

<section id="institutes" class="site-wrap sec">
	<header class="sec-head">
		<p class="eyebrow">Institutes</p>
		<h2>Coaching institutes on {data.brand.name}</h2>
		<p>Every institute has its own public page and student sign-in.</p>
	</header>
	<div class="inst-grid">
		{#each data.institutes.slice(0, 6) as i (i.id)}
			<a class="inst-card rise" href="/i/{i.slug}">
				<span class="inst-logo">{#if i.logoUrl}<img src={i.logoUrl} alt="" />{:else}<Building2 />{/if}</span>
				<span class="grow"><span class="inst-name">{i.name}</span><span class="inst-tag">{i.tagline || i.address || 'Student portal'}</span></span>
				<span class="chev"><ArrowRight /></span>
			</a>
		{:else}
			<div class="empty-inst">
				<Building2 />
				<p>No institutes are public yet. The first one created by the platform owner appears here.</p>
			</div>
		{/each}
	</div>
</section>

<section class="site-wrap sec">
	<div class="cta-band rise">
		<div>
			<p class="eyebrow">For institute owners</p>
			<h2>Bring your coaching institute online</h2>
			<p>Tests, materials, results, students and announcements — without stitching together five tools.</p>
		</div>
		<div class="cta-actions">
			<a class="btn btn-primary btn-lg" href="/contact">Talk to us<ArrowRight /></a>
			<a class="btn btn-ghost btn-lg" href="/login">Sign in</a>
		</div>
	</div>
</section>

<style>
	.hero { display: grid; gap: 2.5rem; align-items: center; padding: clamp(2.5rem, 6vw, 5rem) var(--gutter) clamp(2rem, 4vw, 3.5rem); }
	@media (min-width: 980px) { .hero { grid-template-columns: 1.1fr 0.9fr; gap: 3rem; } }
	.hero-kicker { display: inline-flex; align-items: center; gap: .4rem; font-size: .75rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: hsl(var(--primary)); }
	.hero-kicker::before { content: ""; width: .5rem; height: .5rem; border-radius: 99px; background: currentColor; }
	h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(2.6rem, 2rem + 4vw, 4.6rem); line-height: .98; letter-spacing: -.045em; margin-top: .6rem; }
	h1 .line { display: block; }
	h1 .accent { color: hsl(var(--primary)); }
	.hero-sub { max-width: 36rem; margin-top: 1.1rem; font-size: clamp(1rem, .95rem + .3vw, 1.15rem); line-height: 1.7; color: hsl(var(--muted-foreground)); }
	.hero-cta { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1.5rem; }
	.hero-points { display: flex; flex-wrap: wrap; gap: .5rem 1.1rem; margin-top: 1.4rem; }
	.hero-points li { display: flex; align-items: center; gap: .35rem; font-size: .82rem; color: hsl(var(--muted-foreground)); }
	.hero-points :global(svg) { width: .95rem; height: .95rem; color: hsl(var(--success)); flex-shrink: 0; }
	.hero-media { display: grid; place-items: center; }
	.mock { width: min(100%, 28rem); border-radius: 1.5rem; border: 1px solid hsl(var(--border)); background: hsl(var(--surface)); box-shadow: var(--shadow-lg); overflow: hidden; transform: rotate(-1.2deg); }
	.mock-bar { display: flex; align-items: center; justify-content: space-between; padding: .7rem .9rem; border-bottom: 1px solid hsl(var(--border)); background: hsl(var(--muted) / .5); }
	.mock-pill { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; padding: .2rem .5rem; border-radius: 999px; background: hsl(var(--primary) / .12); color: hsl(var(--primary)); }
	.mock-body { padding: 1rem; display: grid; gap: .75rem; }
	.mock-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .4rem; }
	.mock-kpis div { display: grid; gap: .1rem; padding: .6rem .55rem; border-radius: .7rem; background: hsl(var(--muted) / .55); }
	.mock-kpis span { font-size: .58rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; color: hsl(var(--muted-foreground)); }
	.mock-kpis strong { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; line-height: 1; }
	.mock-kpis small { font-size: .55rem; color: hsl(var(--muted-foreground)); }
	.mock-row { display: flex; align-items: center; gap: .55rem; padding: .55rem .6rem; border: 1px solid hsl(var(--border)); border-radius: .65rem; }
	.mock-row .dot { width: .45rem; height: .45rem; border-radius: 99px; background: hsl(var(--primary)); flex-shrink: 0; }
	.mock-row .grow { display: grid; gap: .25rem; flex: 1; }
	.mock-row .bar { display: block; height: .35rem; border-radius: 99px; background: hsl(var(--muted)); }
	.w1 { width: 62%; } .w2 { width: 40%; } .w3 { width: 48%; } .w4 { width: 70%; }
	.mock-row .tag { font-size: .58rem; font-weight: 600; color: hsl(var(--muted-foreground)); }
	.mock-foot { display: flex; align-items: center; gap: .35rem; padding: .55rem .9rem; border-top: 1px solid hsl(var(--border)); font-size: .65rem; color: hsl(var(--muted-foreground)); }
	.mock-foot :global(svg) { width: .8rem; height: .8rem; color: hsl(var(--success)); }
	.strip { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; padding-top: 1rem; padding-bottom: 1rem; border-top: 1px solid hsl(var(--border)); border-bottom: 1px solid hsl(var(--border)); }
	@media (min-width: 760px) { .strip { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
	.strip div { display: grid; gap: .1rem; }
	.strip strong { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; line-height: 1; }
	.strip span { font-size: .78rem; color: hsl(var(--muted-foreground)); }
	.sec { padding-top: clamp(3rem, 6vw, 5rem); }
	.sec-head { max-width: 42rem; margin-bottom: 1.75rem; }
	.sec-head h2 { font-family: var(--font-display); font-weight: 800; font-size: clamp(1.75rem, 1.4rem + 1.6vw, 2.6rem); line-height: 1.08; letter-spacing: -.03em; margin-top: .35rem; text-wrap: balance; }
	.sec-head p:not(.eyebrow) { color: hsl(var(--muted-foreground)); margin-top: .6rem; line-height: 1.65; }
	.modules-grid { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
	.module-card { padding: 1.1rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 1rem; transition: transform .16s, border-color .16s; }
	.module-card:hover { transform: translateY(-2px); border-color: hsl(var(--primary) / .5); }
	.module-icon { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: .75rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); margin-bottom: .6rem; }
	.module-icon :global(svg) { width: 1.15rem; height: 1.15rem; }
	.module-card h3 { font-size: .95rem; font-weight: 700; }
	.module-card p { font-size: .82rem; color: hsl(var(--muted-foreground)); margin-top: .25rem; line-height: 1.55; }
	.how { display: grid; gap: 1.5rem; }
	@media (min-width: 900px) { .how { grid-template-columns: .9fr 1.1fr; align-items: start; } }
	.steps { display: grid; gap: .6rem; }
	.step { display: flex; gap: .8rem; padding: .9rem 1rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 1rem; }
	.bubble { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 999px; background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); font-weight: 800; font-size: .85rem; flex-shrink: 0; }
	.step h3 { font-size: .95rem; font-weight: 700; }
	.step p { font-size: .85rem; color: hsl(var(--muted-foreground)); margin-top: .2rem; line-height: 1.55; }
	.inst-grid { display: grid; gap: .65rem; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); }
	.inst-card { display: flex; align-items: center; gap: .75rem; padding: .85rem 1rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 1rem; transition: border-color .16s; }
	.inst-card:hover { border-color: hsl(var(--primary) / .6); }
	.inst-logo { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; border-radius: .8rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); overflow: hidden; flex-shrink: 0; }
	.inst-logo :global(svg) { width: 1.2rem; height: 1.2rem; }
	.inst-logo img { width: 100%; height: 100%; object-fit: cover; }
	.inst-name { display: block; font-weight: 700; font-size: .92rem; }
	.inst-tag { display: block; font-size: .78rem; color: hsl(var(--muted-foreground)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.chev { display: grid; place-items: center; color: hsl(var(--muted-foreground)); flex-shrink: 0; }
	.chev :global(svg) { width: 1rem; height: 1rem; }
	.empty-inst { display: grid; place-items: center; gap: .5rem; padding: 2.5rem 1rem; text-align: center; color: hsl(var(--muted-foreground)); border: 1px dashed hsl(var(--border)); border-radius: 1rem; grid-column: 1 / -1; }
	.empty-inst :global(svg) { width: 2rem; height: 2rem; }
	.cta-band { display: grid; gap: 1.25rem; padding: clamp(1.5rem, 3vw, 2.5rem); border-radius: 1.5rem; border: 1px solid hsl(var(--border)); background: linear-gradient(135deg, hsl(var(--surface)), hsl(var(--accent) / .7)); }
	@media (min-width: 860px) { .cta-band { grid-template-columns: 1.4fr auto; align-items: center; } }
	.cta-band h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 1.2rem + 1.3vw, 2.1rem); font-weight: 800; letter-spacing: -.02em; margin-top: .25rem; }
	.cta-band p:not(.eyebrow) { color: hsl(var(--muted-foreground)); margin-top: .35rem; }
	.cta-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
</style>

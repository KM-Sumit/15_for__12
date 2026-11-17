<script lang="ts">
	import { ArrowRight, Building2, GraduationCap, Layers, ShieldCheck } from '@lucide/svelte';

	let { data } = $props();
	const values = [
		{ icon: Building2, k: 'One platform, many institutes', body: 'Each coaching institute gets a branded workspace, its own sign-in page and its own data. Nothing is shared by accident.' },
		{ icon: ShieldCheck, k: 'Isolation at the database', body: 'PostgreSQL row-level security backs up the application code. A request can only reach rows for the institute bound to its session.' },
		{ icon: Layers, k: 'Modules, not monoliths', body: 'Tests, question bank, results, materials, students and notifications can be switched on per institute — and blocked at the URL and API.' },
		{ icon: GraduationCap, k: 'Built for exam prep', body: 'Timed tests, live series, question banks, PDFs, result analytics and student management in one workflow.' }
	];
</script>

<svelte:head><title>About · {data.brand.name}</title></svelte:head>

<div class="site-wrap about">
	<header class="hero rise">
		<p class="eyebrow">About</p>
		<h1>Software for coaching institutes that take exam prep seriously.</h1>
		<p class="lead">{data.brand.tagline} {data.brand.name} brings the daily work of an institute — tests, students, content and results — into one focused workspace.</p>
	</header>

	<section class="grid">
		{#each values as v, i (v.k)}
			<article class="card card-pad rise" style="--i: {i}">
				<span class="icon"><v.icon /></span>
				<h2>{v.k}</h2>
				<p>{v.body}</p>
			</article>
		{/each}
	</section>

	<section class="band rise">
		<div>
			<h2>Who it is for</h2>
			<p>Coaching institutes running classroom, online or hybrid batches for government-exam aspirants. The platform owner manages institutes; each institute manages its own students and content.</p>
		</div>
		<a class="btn btn-primary btn-lg" href="/contact">Talk to us<ArrowRight /></a>
	</section>
</div>

<style>
	.about { padding-top: clamp(2rem, 5vw, 4rem); display: grid; gap: 2.5rem; }
	.hero { max-width: 46rem; }
	.hero h1 { font-family: var(--font-display); font-size: clamp(2rem, 1.5rem + 2.5vw, 3.4rem); font-weight: 800; line-height: 1.05; letter-spacing: -.035em; margin-top: .5rem; text-wrap: balance; }
	.lead { color: hsl(var(--muted-foreground)); font-size: 1.05rem; line-height: 1.75; margin-top: 1rem; }
	.grid { display: grid; gap: .9rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
	.icon { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: .75rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); margin-bottom: .65rem; }
	.icon :global(svg) { width: 1.15rem; height: 1.15rem; }
	.card h2 { font-size: 1rem; font-weight: 700; }
	.card p { font-size: .875rem; color: hsl(var(--muted-foreground)); margin-top: .35rem; line-height: 1.65; }
	.band { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.5rem; border-radius: 1.25rem; border: 1px solid hsl(var(--border)); background: linear-gradient(135deg, hsl(var(--surface)), hsl(var(--accent) / .65)); }
	.band h2 { font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; }
	.band p { color: hsl(var(--muted-foreground)); max-width: 40rem; margin-top: .3rem; }
</style>

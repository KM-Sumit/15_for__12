<script lang="ts">
	import { ArrowRight, GraduationCap, Mail, MapPin, Phone, ShieldCheck } from '@lucide/svelte';
	import Brand from '#lib/components/shell/Brand.svelte';

	let { data } = $props();
	const i = $derived(data.institute);
</script>

<svelte:head>
	<title>{i.name} · Student portal</title>
	<meta name="description" content={i.tagline || `Sign in to ${i.name}`} />
</svelte:head>

<div class="institute" style="--inst: {i.primaryColor}">
	<header class="top">
		<Brand href="/" name="EduSphere" />
		<a class="btn btn-secondary btn-sm" href="/i/{i.slug}/login">Sign in</a>
	</header>

	<main class="hero">
		<div class="copy rise">
			<p class="eyebrow">Student portal</p>
			<div class="identity">
				<span class="logo">{#if i.logoUrl}<img src={i.logoUrl} alt="" />{:else}<GraduationCap />{/if}</span>
				<h1>{i.name}</h1>
			</div>
			{#if i.tagline}<p class="tagline">{i.tagline}</p>{/if}
			{#if i.description}<p class="desc">{i.description}</p>{/if}
			<div class="cta">
				<a class="btn btn-primary btn-lg" href="/i/{i.slug}/login">Sign in to your account<ArrowRight /></a>
				<a class="btn btn-ghost btn-lg" href="/i/{i.slug}/login">New student? Use Google</a>
			</div>
			<ul class="trust">
				<li><ShieldCheck />Private to {i.name} students</li>
				<li><GraduationCap />Tests, materials and results</li>
			</ul>
		</div>

		<aside class="card card-pad contact rise" style="--i: 1">
			<h2>Contact the institute</h2>
			{#if i.address}<p><MapPin />{i.address}</p>{/if}
			{#if i.phone}<p><Phone /><a href="tel:{i.phone}">{i.phone}</a></p>{/if}
			{#if i.contactEmail}<p><Mail /><a href="mailto:{i.contactEmail}">{i.contactEmail}</a></p>{/if}
			{#if i.website}<a class="btn btn-secondary btn-sm" href={i.website} target="_blank" rel="noopener">Visit website</a>{/if}
			{#if !i.phone && !i.contactEmail && !i.address}<p class="muted small">Contact details will appear here once the institute adds them.</p>{/if}
		</aside>
	</main>

	<footer class="foot">
		<span>Powered by <a href="/">EduSphere</a></span>
		<a href="/login">Platform sign in</a>
	</footer>
</div>

<style>
	.institute { min-height: 100svh; display: flex; flex-direction: column; padding: 0 var(--gutter) calc(2rem + var(--safe-bottom)); }
	.top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; height: 64px; max-width: 72rem; margin: 0 auto; width: 100%; }
	.hero { flex: 1; width: 100%; max-width: 72rem; margin: 0 auto; display: grid; gap: 2rem; align-items: center; padding: clamp(2rem, 5vw, 4rem) 0; }
	@media (min-width: 900px) { .hero { grid-template-columns: 1.5fr 1fr; } }
	.identity { display: flex; align-items: center; gap: .9rem; margin: .35rem 0 .6rem; }
	.logo { display: grid; place-items: center; width: 3.5rem; height: 3.5rem; border-radius: 1rem; background: color-mix(in srgb, var(--inst) 14%, transparent); color: var(--inst); overflow: hidden; flex-shrink: 0; }
	.logo :global(svg) { width: 1.6rem; height: 1.6rem; }
	.logo img { width: 100%; height: 100%; object-fit: cover; }
	h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(2rem, 1.5rem + 2.6vw, 3.4rem); line-height: 1.05; letter-spacing: -.03em; }
	.tagline { font-size: 1.1rem; font-weight: 600; color: var(--inst); margin-bottom: .6rem; }
	.desc { max-width: 40rem; color: hsl(var(--muted-foreground)); line-height: 1.7; }
	.cta { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1.25rem; }
	.trust { display: flex; flex-wrap: wrap; gap: .75rem 1.25rem; margin-top: 1.5rem; font-size: .85rem; color: hsl(var(--muted-foreground)); }
	.trust li { display: flex; align-items: center; gap: .35rem; }
	.trust :global(svg) { width: 1rem; height: 1rem; color: hsl(var(--success)); }
	.contact { display: grid; gap: .5rem; justify-items: start; }
	.contact h2 { font-size: 1rem; font-weight: 700; margin-bottom: .25rem; }
	.contact p { display: flex; align-items: center; gap: .45rem; font-size: .9rem; }
	.contact :global(svg) { width: 1rem; height: 1rem; color: hsl(var(--muted-foreground)); flex-shrink: 0; }
	.foot { max-width: 72rem; width: 100%; margin: 0 auto; display: flex; justify-content: space-between; gap: 1rem; padding-top: 1rem; border-top: 1px solid hsl(var(--border)); font-size: .8rem; color: hsl(var(--muted-foreground)); }
	.foot a { text-decoration: underline; }
</style>

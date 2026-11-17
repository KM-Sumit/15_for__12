<script lang="ts">
	import { page } from '$app/state';
	import { beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ArrowRight, Menu, X } from '@lucide/svelte';
	import Brand from '#lib/components/shell/Brand.svelte';
	import ThemeToggle from '#lib/components/ui/ThemeToggle.svelte';
	import { homeHref } from '#lib/features/auth/schema';

	let { data, children } = $props();

	const links = [
		{ href: '/#modules', label: 'Modules' },
		{ href: '/#institutes', label: 'Institutes' },
		{ href: '/#how', label: 'How it works' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' }
	];
	const path = $derived(page.url.pathname);
	const bare = $derived(path === '/login');
	const home = $derived(data.user ? homeHref(data.user) : '/');

	let menu = $state(false);
	let scrolled = $state(false);
	beforeNavigate(() => (menu = false));
	onMount(() => {
		const on = () => (scrolled = scrollY > 8);
		on();
		addEventListener('scroll', on, { passive: true });
		return () => removeEventListener('scroll', on);
	});
</script>

<div class="site">
	<header class={['site-head', { 'is-scrolled': scrolled }]}>
		<div class="site-wrap site-head-inner">
			<Brand href={home} name={data.brand.name} />
			{#if !bare}
				<nav class="site-nav" aria-label="Main">
					{#each links as l (l.href)}
						<a href={l.href}>{l.label}</a>
					{/each}
				</nav>
			{/if}
			<div class="site-actions">
				<ThemeToggle />
				{#if !bare}
					{#if data.user}
						<a href={home} class="btn btn-primary btn-sm hidden sm:inline-flex">Open workspace</a>
					{:else}
						<a href="/login" class="btn btn-ghost btn-sm hidden sm:inline-flex">Sign in</a>
						<a href="/login" class="btn btn-primary btn-sm hidden sm:inline-flex">Get started</a>
					{/if}
					<button type="button" class="icon-btn site-menu-btn" aria-label="Menu" aria-expanded={menu} onclick={() => (menu = true)}><Menu /></button>
				{/if}
			</div>
		</div>
	</header>

	{#if menu}
		<div class="site-scrim" role="presentation" onclick={() => (menu = false)}></div>
		<div class="site-sheet" role="dialog" aria-modal="true" aria-label="Menu">
			<div class="flex items-center justify-between">
				<Brand href={home} name={data.brand.name} />
				<button type="button" class="icon-btn" aria-label="Close menu" onclick={() => (menu = false)}><X /></button>
			</div>
			<nav class="site-sheet-nav" aria-label="Main">
				{#each links as l (l.href)}
					<a href={l.href}>{l.label}<ArrowRight /></a>
				{/each}
			</nav>
			<div class="grid gap-2">
				{#if data.user}
					<a href={home} class="btn btn-primary btn-lg btn-block">Open workspace</a>
				{:else}
					<a href="/login" class="btn btn-primary btn-lg btn-block">Sign in</a>
					<a href="/login" class="btn btn-secondary btn-lg btn-block">Create an account</a>
				{/if}
			</div>
		</div>
	{/if}

	<main id="main" class="site-main">{@render children()}</main>

	{#if !bare}
		<footer class="site-foot">
			<div class="site-wrap site-foot-grid">
				<div class="foot-brand">
					<Brand href="/" name={data.brand.name} />
					<p class="mt-3 text-sm muted">{data.brand.footerNote}</p>
					{#if data.brand.tagline}<p class="foot-motto mt-4">{data.brand.tagline}</p>{/if}
				</div>
				<div>
					<p class="foot-h">Platform</p>
					<a href="/#modules">Modules</a><a href="/#institutes">Institutes</a><a href="/#how">How it works</a>
				</div>
				<div>
					<p class="foot-h">Company</p>
					<a href="/about">About</a><a href="/contact">Contact</a><a href="/login">Sign in</a>
				</div>
				<div>
					<p class="foot-h">Legal</p>
					<a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/legal/refunds">Refunds</a><a href="/legal/cookies">Cookies</a><a href="/legal/delete-account">Delete account</a>
				</div>
				{#if data.brand.supportEmail || data.brand.supportPhone}
					<div>
						<p class="foot-h">Support</p>
						{#if data.brand.supportEmail}<a href="mailto:{data.brand.supportEmail}">{data.brand.supportEmail}</a>{/if}
						{#if data.brand.supportPhone}<a href="tel:{data.brand.supportPhone}">{data.brand.supportPhone}</a>{/if}
					</div>
				{/if}
			</div>
			<div class="site-wrap foot-base">
				<span>© {new Date().getFullYear()} {data.brand.name}. Multi-tenant exam preparation platform.</span>
				<a href="/super/login">Platform access</a>
			</div>
		</footer>
	{/if}
</div>

<style>
	.site { min-height: 100svh; display: flex; flex-direction: column; }
	:global(.site-wrap) { width: 100%; max-width: calc(76rem + 2 * var(--gutter)); margin: 0 auto; padding: 0 var(--gutter); }
	.site-head { position: sticky; top: 0; z-index: 40; padding-top: var(--safe-top); background: hsl(var(--background) / 0.82); backdrop-filter: saturate(1.4) blur(14px); -webkit-backdrop-filter: saturate(1.4) blur(14px); border-bottom: 1px solid transparent; transition: border-color 0.2s; }
	.site-head.is-scrolled { border-bottom-color: hsl(var(--border)); }
	.site-head-inner { display: flex; align-items: center; gap: 1.5rem; height: 64px; }
	.site-head-inner :global(.brand), .site-head-inner :global(.brand-name) { min-width: 0; }
	.site-nav { display: none; gap: .15rem; margin-left: auto; }
	.site-nav a { padding: .5rem .7rem; border-radius: 999px; font-size: .9rem; font-weight: 500; color: hsl(var(--muted-foreground)); transition: color .15s, background-color .15s; }
	.site-nav a:hover { color: hsl(var(--foreground)); background: hsl(var(--muted)); }
	.site-actions { display: flex; align-items: center; gap: .375rem; margin-left: auto; }
	@media (min-width: 1024px) { .site-nav { display: flex; } .site-actions { margin-left: 0; } .site-menu-btn { display: none; } }
	.site-scrim { position: fixed; inset: 0; z-index: 60; background: hsl(222 22% 10% / 0.4); animation: fade 0.2s ease-out; }
	@keyframes fade { from { opacity: 0; } }
	.site-sheet { position: fixed; top: 0; right: 0; bottom: 0; z-index: 61; width: min(24rem, 100%); display: flex; flex-direction: column; gap: 1.5rem; padding: calc(0.75rem + var(--safe-top)) 1.25rem calc(1.25rem + var(--safe-bottom)); background: hsl(var(--surface)); box-shadow: var(--shadow-lg); animation: menu-in 0.28s var(--ease-ios); overflow-y: auto; }
	@keyframes menu-in { from { transform: translateX(100%); } }
	.site-sheet-nav { display: flex; flex-direction: column; }
	.site-sheet-nav a { display: flex; align-items: center; justify-content: space-between; min-height: 56px; font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; border-bottom: 1px solid hsl(var(--border)); }
	.site-sheet-nav a :global(svg) { width: 20px; height: 20px; color: hsl(var(--muted-foreground)); }
	.site-main { flex: 1; min-width: 0; }
	.site-foot { margin-top: 4rem; border-top: 1px solid hsl(var(--border)); background: hsl(var(--surface)); padding: 3rem 0 calc(1.5rem + var(--safe-bottom)); }
	.site-foot-grid { display: grid; gap: 2rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.site-foot-grid > :first-child { grid-column: 1 / -1; }
	@media (min-width: 900px) { .site-foot-grid { grid-template-columns: 2fr repeat(4, minmax(0, 1fr)); } .site-foot-grid > :first-child { grid-column: auto; } }
	.site-foot-grid a { display: block; padding: 0.3rem 0; font-size: 0.9375rem; color: hsl(var(--muted-foreground)); }
	.site-foot-grid a:hover { color: hsl(var(--foreground)); }
	.foot-h { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem; }
	.foot-motto { font-family: var(--font-display); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.75rem; color: hsl(var(--primary)); }
	.foot-base { margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid hsl(var(--border)); font-size: 0.8125rem; color: hsl(var(--muted-foreground)); display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; }
	.foot-base a:hover { color: hsl(var(--foreground)); }
</style>

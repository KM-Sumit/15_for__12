<script lang="ts">
	// Signed-in shell shared by the student app (/app) and staff (/admin).
	// >= 1024px: grouped sidebar. Below: app bar with a large-title collapse + bottom tab bar (iOS capsule,
	// Android Material bar). Pages swap instantly — no enter animation or loading bar on each tap.
	import { onMount, tick, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { Bell, Download, LogOut, Menu, X } from '@lucide/svelte';
	import ThemeToggle from '#lib/components/ui/ThemeToggle.svelte';
	import { canInstall, installApp } from '#lib/pwa/install.svelte';
	import { haptic, platform } from '#lib/client/platform';
	import { trackNavigation } from '#lib/client/history';
	import { activeHref, type NavGroup, type NavItem } from './nav';
	import Brand from './Brand.svelte';

	interface Props {
		groups: NavGroup[];
		tabs: NavItem[];
		/** Adds a "More" tab that opens every group in a sheet (staff). */
		more?: boolean;
		user: { name: string; email: string; avatarUrl: string | null; role: string };
		/** Unread inbox count (student); shows the bell in the app bar. */
		unread?: number;
		inboxHref?: string;
		/** Paths that hide all chrome (exam screen, onboarding). */
		fullScreen?: RegExp;
		/** Label under the brand in the sidebar, e.g. "Staff". */
		area?: string;
		/** Enabled module keys for the current institute. Items with a disabled module are hidden. */
		modules?: string[];
		/** Institute / platform name shown in the brand. */
		instituteName?: string | null;
		children: Snippet;
	}

	let { groups, tabs, more = false, user, unread = 0, inboxHref, fullScreen, area, modules = [], instituteName, children }: Props = $props();
	const allowed = (m?: string) => !m || modules.includes(m);
	const visibleTabs = $derived(tabs.filter((t) => allowed(t.module)));

	const path = $derived(page.url.pathname);
	const chrome = $derived(!fullScreen?.test(path));
	const visibleGroups = $derived(
		groups
			.map((g) => ({ ...g, items: g.items.filter((i) => allowed(i.module) && (!i.adminOnly || user.role === 'admin')) }))
			.filter((g) => g.items.length)
	);
	const allItems = $derived(visibleGroups.flatMap((g) => g.items));
	const sideActive = $derived(activeHref(allItems, path));
	// A page owned by a sidebar item that is not a tab (e.g. /admin/payments) belongs to More, not to the
	// root tab whose prefix it happens to share.
	const tabHrefs = $derived(new Set(visibleTabs.map((t) => t.href)));
	const inMore = $derived(more && !!sideActive && !tabHrefs.has(sideActive));
	const tabActive = $derived(inMore ? undefined : activeHref(visibleTabs, path));
	const tabCount = $derived(visibleTabs.length + (more ? 1 : 0));
	const activeIndex = $derived(inMore ? visibleTabs.length : visibleTabs.findIndex((t) => t.href === tabActive));
	const initials = $derived(
		(user.name || user.email)
			.split(/\s+/)
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	let moreOpen = $state(false);

	$effect(() => {
		document.body.classList.toggle('has-tabbar', chrome);
		return () => document.body.classList.remove('has-tabbar');
	});

	beforeNavigate(() => {
		moreOpen = false;
	});

	// Large title: once the page <h1> passes under the app bar, the bar shows it compact.
	let title = $state('');
	let compact = $state(false);
	let io: IntersectionObserver | undefined;
	async function watchTitle() {
		io?.disconnect();
		await tick();
		const h1 = document.querySelector<HTMLElement>('.page-view h1');
		title = h1?.textContent?.trim() ?? '';
		compact = false;
		if (!h1) return;
		const bar = document.querySelector<HTMLElement>('.appbar')?.offsetHeight ?? 56;
		io = new IntersectionObserver(([e]) => (compact = !e.isIntersecting && e.boundingClientRect.top < bar), {
			rootMargin: `-${bar}px 0px 0px 0px`
		});
		io.observe(h1);
	}
	afterNavigate((n) => {
		trackNavigation(n.type, n.type === 'popstate' ? n.delta : undefined);
		void watchTitle();
	});

	let scrolled = $state(false);
	onMount(() => {
		const onScroll = () => (scrolled = scrollY > 4);
		addEventListener('scroll', onScroll, { passive: true });
		const ripple = (e: PointerEvent) => {
			const el = (e.target as Element | null)?.closest<HTMLElement>('.btn, .list-row, a.card, .chip, .icon-btn, .segmented > *, .press');
			if (!el) return;
			const r = el.getBoundingClientRect();
			el.style.setProperty('--rx', `${e.clientX - r.left}px`);
			el.style.setProperty('--ry', `${e.clientY - r.top}px`);
		};
		if (platform() === 'android') addEventListener('pointerdown', ripple, { passive: true });
		return () => {
			removeEventListener('scroll', onScroll);
			removeEventListener('pointerdown', ripple);
			io?.disconnect();
		};
	});
</script>

{#snippet avatar(size = '')}
	{#if user.avatarUrl}
		<img src={user.avatarUrl} alt="" class="avatar {size}" referrerpolicy="no-referrer" width="36" height="36" />
	{:else}
		<span class="avatar {size}" aria-hidden="true">{initials}</span>
	{/if}
{/snippet}

{#if !chrome}
	<main id="main" class="app-main is-full">{@render children()}</main>
{:else}
	<div class="shell has-sidebar">
		<aside class="sidebar" aria-label="Sidebar">
			<div class="sidebar-brand"><Brand href={visibleTabs[0]?.href ?? '/app'} {area} name={instituteName ?? undefined} /></div>
			<nav class="sidebar-nav" aria-label="Main">
				{#each visibleGroups as g (g.label)}
					{#if visibleGroups.length > 1}<p class="sidebar-group">{g.label}</p>{/if}
					{#each g.items as it (it.href + g.label)}
						<a href={it.href} aria-current={it.href === sideActive ? 'page' : undefined}><it.icon />{it.label}</a>
					{/each}
				{/each}
			</nav>
			<div class="sidebar-foot">
				{@render avatar()}
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-semibold">{user.name || 'Your account'}</p>
					<p class="truncate text-xs muted">{user.email}</p>
				</div>
				<ThemeToggle class="icon-btn icon-btn-sm" />
			</div>
			{#if canInstall.value}
				<button type="button" class="btn btn-ghost btn-sm mt-2 w-full justify-start" onclick={installApp}><Download />Install app</button>
			{/if}
			<form method="POST" action="/logout" class="mt-1">
				<button class="btn btn-ghost btn-sm w-full justify-start"><LogOut />Sign out</button>
			</form>
		</aside>

		<div class="shell-main">
			<header class="appbar" class:is-scrolled={scrolled} class:is-compact={compact && !!title}>
				<div class="appbar-inner">
					<div class="appbar-lead">
						<Brand href={visibleTabs[0]?.href ?? '/app'} compact name={instituteName ?? undefined} />
						<p class="appbar-title" aria-hidden="true">{title}</p>
					</div>
					{#if inboxHref}
						<a href={inboxHref} class="icon-btn relative" aria-label={unread ? `Inbox, ${unread} unread` : 'Inbox'}>
							<Bell />
							{#if unread}<span class="bell-dot" aria-hidden="true"></span>{/if}
						</a>
					{/if}
					<ThemeToggle />
				</div>
			</header>

			<main class="app-main" id="main">
				<div class="page-view">{@render children()}</div>
			</main>
		</div>

		<nav class="tabbar" aria-label="Main" style:--tabs={tabCount}>
			<div class="tabbar-inner">
				{#if activeIndex >= 0}
					<span class="tab-pill" style:transform="translateX({activeIndex * 100}%)" aria-hidden="true"><span></span></span>
				{/if}
				{#each visibleTabs as t, i (t.href)}
					<a href={t.href} aria-current={i === activeIndex ? 'page' : undefined} onclick={() => i !== activeIndex && haptic()}>
						<span class="tab-icon"><t.icon strokeWidth={i === activeIndex ? 2.4 : 1.8} /></span>{t.label}
					</a>
				{/each}
				{#if more}
					<button type="button" aria-current={inMore ? 'page' : undefined} aria-expanded={moreOpen} onclick={() => ((moreOpen = true), haptic())}>
						<span class="tab-icon"><Menu strokeWidth={inMore ? 2.4 : 1.8} /></span>More
					</button>
				{/if}
			</div>
		</nav>

		{#if more && moreOpen}
			<div class="more-scrim" role="presentation" onclick={() => (moreOpen = false)}></div>
			<div class="more-sheet" role="dialog" aria-modal="true" aria-label="All sections">
				<div class="sheet-grip"></div>
				<div class="flex items-center justify-between px-5 pb-1 pt-2">
					<div class="flex items-center gap-3">
						{@render avatar()}
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold">{user.name}</p>
							<p class="truncate text-xs muted">{user.email}</p>
						</div>
					</div>
					<button type="button" class="icon-btn" aria-label="Close" onclick={() => (moreOpen = false)}><X /></button>
				</div>
				<div class="more-body">
					{#each visibleGroups as g (g.label)}
						<p class="sidebar-group">{g.label}</p>
						<div class="more-grid">
							{#each g.items as it (it.href + g.label)}
								<a href={it.href} class="more-item press" aria-current={it.href === sideActive ? 'page' : undefined}>
									<it.icon /><span>{it.label}</span>
								</a>
							{/each}
						</div>
					{/each}
					<form method="POST" action="/logout" class="mt-4">
						<button class="btn btn-secondary btn-block"><LogOut />Sign out</button>
					</form>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.bell-dot {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: hsl(var(--sun));
		box-shadow: 0 0 0 2px hsl(var(--background));
	}
	.more-scrim {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: hsl(222 22% 10% / 0.4);
		animation: cq-fade 0.2s ease-out;
	}
	.more-sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 61;
		max-height: 85svh;
		display: flex;
		flex-direction: column;
		background: hsl(var(--surface));
		border-radius: 20px 20px 0 0;
		box-shadow: var(--shadow-lg);
		animation: cq-sheet-in 0.32s var(--ease-ios);
		padding-bottom: calc(1rem + var(--safe-bottom));
	}
	@media (min-width: 640px) {
		.more-sheet {
			left: 50%;
			width: min(36rem, calc(100% - 2rem));
			transform: translateX(-50%);
			bottom: 1rem;
			border-radius: 20px;
			animation: cq-pop-in 0.2s var(--ease-snappy);
		}
	}
	.more-body {
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0 1.25rem;
		scrollbar-width: none;
	}
	.more-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5rem;
	}
	.more-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		min-height: 76px;
		padding: 0.625rem 0.25rem;
		border-radius: 14px;
		background: hsl(var(--muted));
		font-size: 0.75rem;
		font-weight: 600;
		text-align: center;
		line-height: 1.15;
	}
	.more-item :global(svg) {
		width: 22px;
		height: 22px;
	}
	.more-item[aria-current='page'] {
		background: hsl(var(--accent));
		color: hsl(var(--accent-foreground));
	}
</style>

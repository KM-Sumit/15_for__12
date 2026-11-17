<script lang="ts">
	import { FileText, Link2, Search } from '@lucide/svelte';
	import { page } from '$app/state';

	let { data } = $props();

	const filters = [
		{ key: '', label: 'All' },
		{ key: 'pdf', label: 'PDFs' },
		{ key: 'link', label: 'Links' },
		{ key: 'text', label: 'Reading' }
	] as const;

	const href = (kind: string) => {
		const sp = new URLSearchParams(page.url.search);
		if (kind) sp.set('kind', kind);
		else sp.delete('kind');
		const q = sp.toString();
		return q ? `?${q}` : '?';
	};
	const kindLabel = (k: string) => (k === 'pdf' ? 'PDF' : k === 'link' ? 'Link' : 'Reading');
</script>

<svelte:head><title>Study materials · {data.total}</title></svelte:head>

<div class="wrap">
	<header class="rise">
		<p class="eyebrow">Study materials</p>
		<h1 class="page-title">Resources</h1>
		<p class="page-sub">Notes, PDFs and links shared by your coaching institute.</p>
	</header>

	<form class="search rise" method="GET" style="--i: 1" role="search">
		<Search aria-hidden="true" />
		<input name="q" value={data.q} placeholder="Search materials" aria-label="Search materials" />
		{#if data.kind}<input type="hidden" name="kind" value={data.kind} />{/if}
		<button class="btn btn-secondary btn-sm">Search</button>
	</form>

	<nav class="chips rise" style="--i: 2" aria-label="Filter by type">
		{#each filters as f (f.key)}
			<a class="chip" class:is-active={data.kind === f.key} href={href(f.key)}>{f.label}</a>
		{/each}
	</nav>

	{#if data.materials.length}
		<div class="list rise" style="--i: 3">
			{#each data.materials as m (m.id)}
				<a class="list-row" href="/app/materials/{m.id}">
					<span class="leading-icon">{#if m.kind === 'link'}<Link2 />{:else}<FileText />{/if}</span>
					<span class="grow">
						<span class="title block">{m.title}</span>
						<span class="meta block">{kindLabel(m.kind)}{m.description ? ` · ${m.description}` : ''}</span>
					</span>
				</a>
			{/each}
		</div>
	{:else}
		<div class="empty rise" style="--i: 3">
			<FileText />
			<p>{data.total ? 'No material matches that search.' : 'Your institute has not published study material yet.'}</p>
			{#if data.total}<a class="btn btn-secondary btn-sm" href="/app/materials">Clear filters</a>{/if}
		</div>
	{/if}
</div>

<style>
	.wrap { max-width: 56rem; margin: 0 auto; padding: 0 var(--gutter) 3rem; display: grid; gap: 1.1rem; }
	.search { display: flex; align-items: center; gap: .55rem; padding: .35rem .35rem .35rem .85rem; background: hsl(var(--surface)); border: 1px solid hsl(var(--border)); border-radius: 999px; }
	.search :global(svg) { width: 1rem; height: 1rem; color: hsl(var(--muted-foreground)); flex-shrink: 0; }
	.search input { flex: 1; min-width: 0; border: 0; background: transparent; font: inherit; font-size: .9375rem; outline: none; }
	.chips { display: flex; gap: .4rem; overflow-x: auto; scrollbar-width: none; padding-bottom: .15rem; }
	.chips::-webkit-scrollbar { display: none; }
	.chip { padding: .4rem .8rem; border-radius: 999px; border: 1px solid hsl(var(--border)); background: hsl(var(--surface)); font-size: .8125rem; font-weight: 600; white-space: nowrap; color: hsl(var(--muted-foreground)); }
	.chip.is-active { background: hsl(var(--foreground)); color: hsl(var(--background)); border-color: transparent; }
	.leading-icon { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: .75rem; background: hsl(var(--accent)); color: hsl(var(--accent-foreground)); flex-shrink: 0; }
	.leading-icon :global(svg) { width: 1.1rem; height: 1.1rem; }
	.list-row .meta { max-width: 42rem; }
	.empty { display: grid; place-items: center; gap: .65rem; padding: 3rem 1rem; text-align: center; color: hsl(var(--muted-foreground)); border: 1px dashed hsl(var(--border)); border-radius: 1rem; }
	.empty :global(svg) { width: 2rem; height: 2rem; }
</style>

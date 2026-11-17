<script lang="ts">
	import { ArrowLeft, ExternalLink, FileText, Link2 } from '@lucide/svelte';
	import Markdown from '#lib/components/kit/Markdown.svelte';
	import PdfViewer from '#lib/components/kit/PdfViewer.svelte';

	let { data } = $props();
	const m = $derived(data.material);
</script>

<svelte:head><title>{m.title} · Study material</title></svelte:head>

<div class="page-narrow detail">
	<a class="back" href="/app/materials"><ArrowLeft />All materials</a>

	<header>
		<p class="eyebrow">{m.kind === 'pdf' ? 'PDF' : m.kind === 'link' ? 'Link' : 'Reading'}{data.readingMinutes ? ` · ${data.readingMinutes} min read` : ''}</p>
		<h1 class="page-title">{m.title}</h1>
		{#if m.description}<p class="page-sub">{m.description}</p>{/if}
	</header>

	{#if m.kind === 'text'}
		<article class="card card-pad reading">
			<Markdown html={data.html} />
		</article>
	{:else if m.kind === 'pdf' && m.url}
		<article class="card pdf-card">
			<PdfViewer src={m.url} title={m.title} />
		</article>
		<a class="btn btn-primary" href={m.url} target="_blank" rel="noopener"><ExternalLink />Open PDF in a new tab</a>
	{:else if m.kind === 'link' && m.url}
		<article class="card card-pad link-card">
			<Link2 />
			<p>This material opens on an external website.</p>
			<a class="btn btn-primary" href={m.url} target="_blank" rel="noopener"><ExternalLink />Open link</a>
			<p class="tiny muted">{m.url}</p>
		</article>
	{:else}
		<div class="card card-pad link-card">
			<FileText />
			<p class="muted">This material has no file attached yet.</p>
		</div>
	{/if}
</div>

<style>
	.detail { padding-top: 1.25rem; display: grid; gap: 1.25rem; align-items: start; }
	.back { display: inline-flex; align-items: center; gap: .35rem; font-size: .875rem; font-weight: 600; color: hsl(var(--muted-foreground)); }
	.back :global(svg) { width: 1rem; height: 1rem; }
	.reading { min-width: 0; }
	.pdf-card { padding: 0; overflow: hidden; min-height: 70svh; }
	.link-card { display: grid; gap: .75rem; justify-items: start; }
	.link-card :global(svg) { width: 2rem; height: 2rem; color: hsl(var(--primary)); }
</style>

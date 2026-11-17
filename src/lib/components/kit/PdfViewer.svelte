<script lang="ts" module>
	import type { PDFDocumentProxy } from 'pdfjs-dist';

	const loaded: Record<string, Promise<PDFDocumentProxy>> = {};

	function openPdf(url: string): Promise<PDFDocumentProxy> {
		let pending = loaded[url];
		if (!pending) {
			pending = (async () => {
				const pdfjs = await import('pdfjs-dist');
				if (!pdfjs.GlobalWorkerOptions.workerSrc) {
					const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
					pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
				}
				// withCredentials sends session cookies so auth is enforced.
				// The server now proxies R2 bytes directly — no cross-origin redirect,
				// so no CORS issue in mobile WebViews.
				return pdfjs.getDocument({ url, withCredentials: true }).promise;
			})();
			loaded[url] = pending;
		}
		return pending;
	}
</script>

<script lang="ts">
	// Renders ALL pages in a continuous vertical scroll.
	// Pages are lazy-loaded via IntersectionObserver — only visible pages (+ nearby ones)
	// are painted, so the phone never freezes even for 100-page PDFs.
	import MediaWatermark from '#lib/features/security/MediaWatermark.svelte';
	import { getWatermark } from '#lib/features/security/context';
	import { stampCanvas } from '#lib/features/security/mark';

	let { src, title = 'PDF' }: { src: string; title?: string } = $props();

	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let total = $state(0);
	let currentPage = $state(1);

	const wm = getWatermark();
	const mark = $derived(wm.text || 'EduSphere');

	function setup(pagesEl: HTMLDivElement) {
		let cancelled = false;

		(async () => {
			try {
				status = 'loading';
				total = 0;
				currentPage = 1;
				pagesEl.innerHTML = '';

				const pdf = await openPdf(src);
				if (cancelled) return;

				total = pdf.numPages;

				// Build placeholder slots for every page upfront so the scrollbar is correct.
				for (let i = 1; i <= total; i++) {
					const slot = document.createElement('div');
					slot.className = 'page-slot';
					slot.dataset.page = String(i);
					// Approximate A4 portrait height until the real canvas replaces it.
					slot.style.aspectRatio = '0.707';
					pagesEl.appendChild(slot);
				}

				status = 'ready';

				const rendered = new Set<number>();

				const renderPage = async (pageNum: number) => {
					if (rendered.has(pageNum) || cancelled) return;
					rendered.add(pageNum);

					const slot = pagesEl.querySelector(
						`.page-slot[data-page="${pageNum}"]`
					) as HTMLDivElement | null;
					if (!slot) return;

					const page = await pdf.getPage(pageNum);
					if (cancelled) return;

					const width = Math.max(pagesEl.clientWidth || 320, 280);
					const ratio = Math.min(window.devicePixelRatio || 1, 2);
					const base = page.getViewport({ scale: 1 });
					const viewport = page.getViewport({ scale: (width / base.width) * ratio });

					const canvas = document.createElement('canvas');
					canvas.width = Math.floor(viewport.width);
					canvas.height = Math.floor(viewport.height);
					canvas.style.width = '100%';
					canvas.style.height = 'auto';
					canvas.oncontextmenu = (e) => e.preventDefault();

					await page.render({ canvas, viewport }).promise;
					if (cancelled) return;

					const ctx = canvas.getContext('2d');
					if (ctx) stampCanvas(ctx, canvas.width, canvas.height, mark);

					slot.style.aspectRatio = '';
					slot.replaceChildren(canvas);
				};

				// Eagerly render first 3 pages so something shows immediately.
				for (let p = 1; p <= Math.min(3, total); p++) renderPage(p);

				// Lazy-load remaining pages as they scroll into view.
				const observer = new IntersectionObserver(
					(entries) => {
						for (const entry of entries) {
							const pageNum = parseInt(
								(entry.target as HTMLElement).dataset.page ?? '1'
							);
							if (entry.isIntersecting) {
								// Track visible page for the indicator.
								if (entry.intersectionRatio >= 0.15) currentPage = pageNum;
								// Pre-render this page + 2 ahead.
								for (let p = pageNum; p <= Math.min(total, pageNum + 2); p++) {
									renderPage(p);
								}
							}
						}
					},
					{ rootMargin: '400px 0px', threshold: [0, 0.15] }
				);

				pagesEl
					.querySelectorAll('.page-slot')
					.forEach((slot) => observer.observe(slot));

				// Cleanup on destroy / src change.
				const origCleanup = () => { observer.disconnect(); };
				(setup as unknown as { _cleanup?: () => void })._cleanup = origCleanup;
			} catch {
				if (!cancelled) status = 'error';
			}
		})();

		return () => {
			cancelled = true;
		};
	}
</script>

<div class="pdf-view">
	<!-- Slim status / page counter bar -->
	<div class="pdf-bar">
		{#if status === 'loading'}
			<span class="small muted">Opening {title}…</span>
		{:else if status === 'error'}
			<span class="small error" role="alert">PDF kholne mein error aaya.</span>
		{:else}
			<span class="small muted truncate">{title}</span>
			<span class="page-pill">{currentPage} / {total}</span>
		{/if}
	</div>

	<div class="pages-wrap">
		<div class="pages" aria-label={title} {@attach setup}></div>
		<MediaWatermark tone="dark" />
	</div>
</div>

<style>
	.pdf-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* ── Top bar ── */
	.pdf-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}

	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	/* Pill showing "3 / 24" */
	.page-pill {
		flex-shrink: 0;
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		background: var(--surface-2, rgba(0 0 0 / 0.06));
		border-radius: 999px;
		padding: 0.15rem 0.6rem;
		white-space: nowrap;
	}

	/* ── Scroll container ── */
	.pages-wrap {
		position: relative;
	}

	/* Stack of rendered canvases */
	.pages-wrap :global(.pages) {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Each page slot — placeholder keeps scroll height correct before canvas arrives */
	.pages-wrap :global(.page-slot) {
		width: 100%;
		background: var(--surface-1, #f0f0f0);
		border-radius: var(--radius, 8px);
		overflow: hidden;
	}

	.pages-wrap :global(canvas) {
		display: block;
		width: 100%;
		height: auto;
		background: white;
		border-radius: var(--radius, 8px);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
	}
</style>

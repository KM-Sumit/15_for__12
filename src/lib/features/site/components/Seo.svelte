<script lang="ts">
	// Per-page SEO: title, description, canonical, robots, Open Graph/Twitter, optional JSON-LD and breadcrumbs.
	import { page } from '$app/state';
	import { BRAND, LEGAL_NAME, jsonLdScript, seoOrigin, seoTitle } from './format';

	interface Props {
		title: string;
		description: string;
		/** Ancestors + this page, root first; emitted as a schema.org BreadcrumbList. */
		crumbs?: { href: string; label: string }[];
		jsonld?: Record<string, unknown>[];
		noindex?: boolean;
		image?: string;
		ogType?: 'website' | 'article';
	}
	let { title, description, crumbs, jsonld = [], noindex = false, image = '/media/intro-poster.jpg', ogType = 'website' }: Props = $props();

	const origin = $derived(seoOrigin(page.data.origin, page.url.origin));
	const path = $derived(page.url.pathname.replace(/\/+$/, '') || '/');
	const canonical = $derived(origin + path);
	const full = $derived(seoTitle(title));
	const imageUrl = $derived(/^https?:\/\//i.test(image) ? image : origin + image);
	const robots = $derived(noindex ? 'noindex,nofollow' : 'index,follow');
	const blocks = $derived([
		...jsonld,
		...(crumbs?.length
			? [
					{
						'@context': 'https://schema.org',
						'@type': 'BreadcrumbList',
						itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: origin + c.href }))
					}
				]
			: [])
	]);
</script>

<svelte:head>
	<title>{full}</title>
	<meta name="description" content={description} />
	<meta name="robots" content={robots} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="en-IN" href={canonical} />
	<link rel="alternate" hreflang="x-default" href={canonical} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={BRAND} />
	<meta property="og:locale" content="en_IN" />
	<meta property="og:title" content={full} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:alt" content="{BRAND} — {LEGAL_NAME}" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={full} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	{#if blocks.length}{@html blocks.map(jsonLdScript).join('')}{/if}
</svelte:head>

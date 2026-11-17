import { publicInstitutes } from '#lib/features/platform/server/service';
import { LEGAL_SLUGS } from '#lib/features/site/components/legal';
import { env } from '#lib/server/env';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const origin = (env().ORIGIN ?? url.origin).replace(/\/$/, '');
	const institutes = await publicInstitutes();
	const paths: [string, string?][] = [
		['/'],
		['/about'],
		['/contact'],
		['/login'],
		...LEGAL_SLUGS.map((s): [string] => [`/legal/${s}`]),
		...institutes.flatMap((i): [string][] => [[`/i/${i.slug}`], [`/i/${i.slug}/login`]])
	];
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
		.map(([p, mod]) => `<url><loc>${origin}${p}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>`)
		.join('\n')}\n</urlset>`;
	return new Response(xml, { headers: { 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' } });
};

import { error } from '@sveltejs/kit';
import { LEGAL, LEGAL_SLUGS, type LegalSlug } from '#lib/features/site/components/legal';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const slug = params.doc as LegalSlug;
	if (!LEGAL_SLUGS.includes(slug)) error(404, 'Page not found.');
	return { slug, doc: LEGAL[slug] };
};

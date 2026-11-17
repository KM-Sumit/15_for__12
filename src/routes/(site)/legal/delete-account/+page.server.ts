import { LEGAL } from '#lib/features/site/components/legal';
import type { PageServerLoad } from './$types';

/** Dedicated Play Store / account-deletion URL. Not served through [doc], so it cannot 404 from the slug list. */
export const load: PageServerLoad = () => ({
	slug: 'delete-account' as const,
	doc: LEGAL['delete-account']
});

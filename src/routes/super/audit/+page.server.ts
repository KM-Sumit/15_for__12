import { requireSuperAdmin } from '#lib/server/http';
import { listAudit, listInstitutes } from '#lib/features/platform/server/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireSuperAdmin(event);
	const instituteId = event.url.searchParams.get('institute') || null;
	const [entries, institutes] = await Promise.all([listAudit(200, instituteId), listInstitutes()]);
	return { entries, institutes, instituteId: instituteId ?? '' };
};
